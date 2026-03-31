// Steam achievements are edited into the JSON file directly (they do not depict real count of achievements)

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../services/supabaseClient";
import SearchFilter from "./searchFilter";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleMinus } from "@fortawesome/free-solid-svg-icons/faCircleMinus";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons/faRectangleXmark";

type Game = {
    appid: number;
    name: string;
    playtime_forever: number; //Hours played
    rtime_last_played: number; //Epoch time of last played date
    img_icon_url: string; //game icon url
    total_achievements?: number;
    unlocked_achievements?: number;
}

function minToHours(minutes: number): number {
    return Math.round((minutes / 60) * 10) / 10; // Round to 1 decimal place
}

function epochToDate(epoch: number): string {
    const date = new Date(epoch * 1000); // Convert seconds to milliseconds
    if (epoch === 0) {
        return "Never Played";
    }
    return date.toLocaleDateString(undefined, {year: "numeric", month: "short", day: "2-digit"}); // Format as local date string
}

function getGameIconUrl(appid: number, img_icon_url: string): string {
    return `https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/${appid}/${img_icon_url}.jpg`;
}

function getGameHeaderUrl(appid: number): string {
    return `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`;
}

export default function GamePicker() {
    const [games, setGames] = useState<Game[]>([]);
    const [slots, setSlots] = useState<(Game | null)[]>([null, null, null]); // 3 null slots for selected games

    const [pickerOpen, setPickerOpen] = useState(false);
    const [activeSlot, setActiveSlot] = useState<number | null>(null);

    const [searchTerm, setSearchTerm] = useState(""); // Search functionality for game picker
    const modalRef = useRef<HTMLDivElement | null>(null);


    const filteredGames = games.filter((game) =>
        game.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        fetch("/public/data/SampleData.json")
            .then((r) => r.json())
            .then((json) => {
                setGames(json.steam.games);
            });
    }, []);

    // Fetch selected games - persists even after refreshing
    useEffect(() => {
        async function fetchSelectedGames() {
            const { data, error } = await supabase
                .from("user_monitor_games")
                .select("app_id")
                .order("created_at", { ascending: true });
            if (error) {
                console.error("Error fetching selected games:", error.message);
                return;
            }
            if (data && data.length > 0 && games.length > 0) {
                // Map appid in json to app_id in Supabase
                const selectedGames = data
                    .slice(0, 3)
                    .map((row: { app_id: number }) => games.find(g => g.appid === row.app_id) || null);

                while (selectedGames.length < 3) selectedGames.push(null); // Up to 3, but 1st slot will always be filled first
                // if slot 1 is empty, games in slot 2 and 3 will shift left to fill empty slot
                setSlots(selectedGames);
            }
        }
        fetchSelectedGames();
    }, [games]);

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

    const gameMap = new Map(games.map((game) => [game.appid, game]));

    function togglePicker(slotIndex: number) {
        setActiveSlot(slotIndex);
        setPickerOpen(true);
    }


    // Add game
    async function addSelectedGame(appid: number) {
        const { error } = await supabase
            .from("user_monitor_games")
            .insert([{ app_id: appid }]);
        if (error) {
            console.error("Error adding selected game:", error.message);
        }
    }

    // Remove game
    async function removeSelectedGame(appid: number) {
        const { error } = await supabase
            .from("user_monitor_games")
            .delete()
            .eq("app_id", appid);
        if (error) {
            console.error("Error removing selected game:", error.message);
        }
    }

    async function selectGame(appid: number) {
        if (activeSlot === null) return;

        const newSlots = [...slots];
        newSlots[activeSlot] = gameMap.get(appid) || null;
        setSlots(newSlots);
        setPickerOpen(false);
        await addSelectedGame(appid);
    }

    async function clearSlot(slotIndex: number) {
        const game = slots[slotIndex];
        const newSlots = [...slots];
        newSlots[slotIndex] = null;
        setSlots(newSlots);
        if (game) {
            await removeSelectedGame(game.appid);
        }
    }

    return (
        <div className="mt-5 bg-(--background-color) p-5 rounded-sm outline outline-white/10 w-full">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-semibold text-(--disabled-color)">Monitor up to three games</h3>
                {/* <FontAwesomeIcon icon={faCircleInfo} size='lg' style={{color: "var(--disabled-color)"}}/> */}
            </div>
            <p className="text-base text-gray-300">
                Select up to three games to monitor their playtime, last played date, and achievements at a glance. Your selections will be saved for future visits.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full mx-auto mt-5">
                {slots.map((game, index) => (
                    <div key={index}>
                        {game ? (
                            <div 
                                className="rounded-sm overflow-hidden"
                                style={{boxShadow: `0 -1px 5px -1px var(--primary-color)`}}
                            >
                                <div className="relative">
                                    <motion.img 
                                        src={getGameHeaderUrl(game.appid)} 
                                        alt={game.name} 
                                        className="object-contain rounded-sm" 
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ duration: 0.2 }}
                                    />
                                    <FontAwesomeIcon 
                                        icon={faCircleMinus} 
                                        style={{color: "rgb(255, 0, 0)",}} 
                                        onClick={() => clearSlot(index)}
                                        className="absolute top-2 right-2 text-2xl hover:opacity-80 cursor-pointer"
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

            {/* Game Picker Modal */}
            {pickerOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div 
                        className="bg-(--background-color) rounded-sm outline outline-white/10 w-full max-w-xl h-[80vh] flex flex-col relative"
                        ref={modalRef}
                        >
                        <div className="sticky z-10 bg-(--background-color) px-5 py-5 mt-3 flex justify-between items-center border-b border-white/10 rounded-sm">
                            <SearchFilter 
                                searchTerm={searchTerm} 
                                setSearchTerm={setSearchTerm}
                                onClear={() => setSearchTerm("")}
                            />
                        </div>
                        <FontAwesomeIcon 
                            icon={faRectangleXmark} 
                            style={{color: "#29bdff",}}
                            className="absolute top-2 right-5 text-4xl cursor-pointer hover:opacity-80 z-20"
                            onClick={() => setPickerOpen(false)} 
                        />

                        <div className="bg-(--background-inner-color) flex-1 p-4 overflow-y-auto flex flex-col rounded-sm">
                            <ul className="flex-1 space-y-2">
                            {filteredGames.map((game) => (
                                <li
                                    key={game.appid}
                                    className="text-(--text-color) py-2 px-2"
                                >
                                    <button onClick={() => selectGame(game.appid)} 
                                        className="w-full text-left px-3 py-3 rounded-sm hover:bg-white/10 text-(--text-color)"
                                        >
                                        <img src={getGameIconUrl(game.appid, game.img_icon_url)} alt={game.name} 
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
