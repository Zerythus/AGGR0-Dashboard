// Steam achievements are edited into the JSON file directly (they do not depict real count of achievements)

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../services/supabaseClient";
import SearchFilter from "./searchFilter";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons/faRectangleXmark";

type Platform = "steam" | "epic";

type Game = {
    appid: number;
    name: string;
    playtime_forever: number;
    rtime_last_played: number;
    img_icon_url: string;
    total_achievements?: number;
    unlocked_achievements?: number;
    platform?: Platform;
    image_url?: string;
};

type MonitorRow = {
    app_id: number;
    platform: Platform;
    slot_index: number;
};

function minToHours(minutes: number): number {
    return Math.round((minutes / 60) * 10) / 10;
}

function epochToDate(epoch: number): string {
    const date = new Date(epoch * 1000);
    if (epoch === 0) {
        return "Never Played";
    }
    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
    });
}

function getGameIconUrl(appid: number, img_icon_url: string, platform?: Platform): string {
    if (platform === "epic") {
        return "/icons/epic-games.svg";
    }

    return `https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/${appid}/${img_icon_url}.jpg`;
}

function getGameHeaderUrl(game: Game): string {
    if (game.platform === "epic" && game.image_url) {
        return game.image_url;
    }

    return `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg`;
}

interface GamePickerProps {
    isSteamConnected: boolean;
    isEpicConnected: boolean;
}

export default function GamePicker({ isSteamConnected, isEpicConnected }: GamePickerProps) {
    const [games, setGames] = useState<Game[]>([]);
    const [slots, setSlots] = useState<(Game | null)[]>([null, null, null]);

    const [pickerOpen, setPickerOpen] = useState(false);
    const [activeSlot, setActiveSlot] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const modalRef = useRef<HTMLDivElement | null>(null);

    const filteredGames = games.filter((game) =>
        game.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const gameKey = (appid: number, platform?: Platform) => `${platform ?? "steam"}-${appid}`;

    const gameMap = useMemo(() => {
        return new Map<string, Game>(
            games.map((game) => [gameKey(game.appid, game.platform), game])
        );
    }, [games]);

    useEffect(() => {
        async function getCurrentUser() {
            const {
                data: { user },
                error,
            } = await supabase.auth.getUser();

            if (error) {
                console.error("Error getting current user:", error.message);
                return;
            }

            setCurrentUserId(user?.id ?? null);
        }

        getCurrentUser();
    }, []);

    useEffect(() => {
        const fetchGames = async () => {
            const allGames: Game[] = [];

            if (isSteamConnected) {
                try {
                    const response = await fetch("/data/SteamData.json");
                    const json = await response.json();
                    const steamGames = json.steam.games.map((game: Game) => ({
                        ...game,
                        platform: "steam" as const,
                    }));
                    allGames.push(...steamGames);
                } catch (error) {
                    console.error("Error fetching Steam data:", error);
                }
            }

            if (isEpicConnected) {
                try {
                    const response = await fetch("/data/EpicData.json");
                    const json = await response.json();
                    const epicGames = json.epic.games.map((game: Game) => ({
                        ...game,
                        platform: "epic" as const,
                    }));
                    allGames.push(...epicGames);
                } catch (error) {
                    console.error("Error fetching Epic data:", error);
                }
            }

            setGames(allGames);
        };

        fetchGames();
    }, [isSteamConnected, isEpicConnected]);

    useEffect(() => {
        async function fetchSelectedGames() {
            if (!currentUserId) return;

            const { data, error } = await supabase
                .from("user_monitor_games")
                .select("app_id, platform, slot_index")
                .eq("user_id", currentUserId)
                .order("slot_index", { ascending: true });

            if (error) {
                console.error("Error fetching selected games:", error.message);
                return;
            }

            const nextSlots: (Game | null)[] = [null, null, null];

            (data as MonitorRow[]).forEach((row) => {
                if (row.slot_index >= 0 && row.slot_index <= 2) {
                    const matchedGame = gameMap.get(gameKey(row.app_id, row.platform)) || null;
                    nextSlots[row.slot_index] = matchedGame;
                }
            });

            setSlots(nextSlots);
        }

        fetchSelectedGames();
    }, [currentUserId, gameMap]);

    useEffect(() => {
        if (!pickerOpen) return;

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                setPickerOpen(false);
            }
        }

        function handleMouseDown(e: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                setPickerOpen(false);
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleMouseDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("mousedown", handleMouseDown);
        };
    }, [pickerOpen]);

    function togglePicker(slotIndex: number) {
        setActiveSlot(slotIndex);
        setPickerOpen(true);
    }

    async function rewriteMonitorGames(nextSlots: (Game | null)[]) {
        if (!currentUserId) return;

        const { error: deleteError } = await supabase
            .from("user_monitor_games")
            .delete()
            .eq("user_id", currentUserId);

        if (deleteError) {
            console.error("Error rewriting monitor games:", deleteError.message);
            return;
        }

        const rows = nextSlots
            .map((game, index) => {
                if (!game?.platform) return null;

                return {
                    user_id: currentUserId,
                    app_id: game.appid,
                    platform: game.platform,
                    slot_index: index,
                };
            })
            .filter((row): row is {
                user_id: string;
                app_id: number;
                platform: Platform;
                slot_index: number;
            } => row !== null);

        if (rows.length === 0) return;

        const { error: insertError } = await supabase
            .from("user_monitor_games")
            .insert(rows);

        if (insertError) {
            console.error("Error saving monitor games:", insertError.message);
        }
    }

    async function selectGame(game: Game) {
        if (activeSlot === null || !game.platform) return;

        const nextSlots = [...slots];

        for (let i = 0; i < nextSlots.length; i++) {
            const slotGame = nextSlots[i];
            if (
                slotGame &&
                slotGame.appid === game.appid &&
                slotGame.platform === game.platform
            ) {
                nextSlots[i] = null;
            }
        }

        nextSlots[activeSlot] = game;

        setSlots(nextSlots);
        setPickerOpen(false);
        setActiveSlot(null);

        await rewriteMonitorGames(nextSlots);
    }

    async function clearSlot(slotIndex: number) {
        const nextSlots = [...slots];
        nextSlots[slotIndex] = null;

        setSlots(nextSlots);
        await rewriteMonitorGames(nextSlots);
    }

    return (
        <div className="mt-5 bg-(--background-color) p-5 rounded-sm outline outline-white/10 w-full">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-semibold text-(--disabled-color)">Monitor up to three games</h3>
            </div>
            <p className="text-base text-(--secondary-text-color)">
                Select up to three games to monitor their playtime, last played date, and achievements at a glance. Your selections will be saved for future visits.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full mx-auto mt-5">
                {slots.map((game, index) => (
                    <div key={index}>
                        {game ? (
                            <div
                                className="rounded-sm overflow-hidden"
                                style={{ boxShadow: `0 -1px 5px -1px var(--primary-color)` }}
                            >
                                <div className="relative">
                                    <motion.img
                                        src={getGameHeaderUrl(game)}
                                        alt={game.name}
                                        className="w-full h-50 object-cover rounded-sm"
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ duration: 0.2 }}
                                    />
                                    <img
                                        src="/icons/bin.png"
                                        alt="Delete Game"
                                        onClick={() => clearSlot(index)}
                                        className="absolute top-2 right-2 h-7 w-7 hover:opacity-80 cursor-pointer shadow shadow-white rounded-full"
                                    />
                                </div>

                                <div className="p-4 rounded-b-sm">
                                    <h3 className="text-lg font-semibold mb-2 text-(--primary-color)">{game.name}</h3>

                                    <div className="flex justify-between items-center">
                                        <p>Playtime: </p>
                                        <p>{minToHours(game.playtime_forever)} hours</p>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <p>Last Played: </p>
                                        <p>{epochToDate(game.rtime_last_played)}</p>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <p>Achievements: </p>
                                        <p>{game.unlocked_achievements || 0} / {game.total_achievements || 0} completed</p>
                                    </div>

                                    <div className="flex justify-between items-center mt-5">
                                        <p>Gaming Platform: </p>
                                        <p>{game.platform === "epic" ? "Epic Games" : "Steam"}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="card outline-2 outline-dashed outline-(--primary-color) text-(--disabled-color) bg-(--background-color2) hover:bg-(--hover-primary-color) hover:outline-0 hover:text-(--disabled-color) active:bg-(--pressed-primary-color) rounded-sm">
                                <button
                                    onClick={() => togglePicker(index)}
                                    className="card-body w-full min-h-40 flex flex-col items-center justify-center text-xl text-primary hover:text-black"
                                >
                                    <div className="text-2xl font-semibold">+</div>
                                    <div className="text-base">Add Game</div>
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {pickerOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div
                        className="bg-(--background-color) rounded-sm outline outline-white/10 w-full max-w-xl h-[80vh] flex flex-col relative"
                        ref={modalRef}
                    >
                        <div className="flex justify-between items-center p-5">
                            <div className="sticky z-10 bg-(--background-color) flex px-2 justify-between items-center w-full">
                                <SearchFilter
                                    searchTerm={searchTerm}
                                    setSearchTerm={setSearchTerm}
                                    onClear={() => setSearchTerm("")}
                                />
                            </div>

                            <FontAwesomeIcon
                                icon={faRectangleXmark}
                                style={{ color: "#29bdff" }}
                                className="text-4xl cursor-pointer hover:opacity-80"
                                onClick={() => {
                                    setPickerOpen(false);
                                    setActiveSlot(null);
                                }}
                            />
                        </div>

                        <div className="bg-(--background-inner-color) flex-1 p-2 overflow-y-auto flex flex-col rounded-sm">
                            <ul className="flex-1">
                                {filteredGames.map((game) => (
                                    <li
                                        key={`${game.platform}-${game.appid}`}
                                        className="text-(--text-color) py-2 px-2"
                                    >
                                        <button
                                            onClick={() => selectGame(game)}
                                            className="w-full text-left px-3 py-3 rounded-sm hover:bg-white/10 text-(--text-color)"
                                        >
                                            <img
                                                src={getGameIconUrl(game.appid, game.img_icon_url, game.platform)}
                                                alt={game.name}
                                                className="w-6 h-6 inline mr-2"
                                            />
                                            {game.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}