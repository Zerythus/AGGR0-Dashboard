import { useEffect, useState, useCallback } from "react";
import { supabase } from "../services/supabaseClient";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons/faRectangleXmark";

type Game = {
    appid: number;
    name: string;
    playtime_forever: number; //Hours played
    rtime_last_played: number; //Epoch time of last played date
    total_achievements?: number;
    unlocked_achievements?: number;
    platform?: "steam" | "epic";
    image_url?: string;
    developer?: string;
    genres?: string[];
    metacritic?: number;
    esrb?: string;
    pegi?: string;
}

type Achievement = {
    apiname: string;
    name: string;
    description: string;
    icon: string;
    icongray: string;
    achieved: boolean;
    unlocktime: number;
};

function epochToDate(epoch: number): string {
    const date = new Date(epoch * 1000); // Convert seconds to milliseconds
    if (epoch === 0) {
        return "Never Played";
    }
    return date.toLocaleDateString(undefined, {year: "numeric", month: "short", day: "2-digit"}); // Format as local date string
}

function getGameHeaderUrl(game: Game): string {
    if (game.platform === "epic" && game.image_url) {
        return game.image_url;
    }
    return `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg`;
}

interface Top3GamesProps {
    isSteamConnected: boolean;
    isEpicConnected: boolean;
}

export default function Top3Games({ isSteamConnected, isEpicConnected }: Top3GamesProps) {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [steamId, setSteamId] = useState<string | null>(null);
    const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);
    const [selectedGameForAchievements, setSelectedGameForAchievements] = useState<Game | null>(null);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [currentAchievementsPage, setCurrentAchievementsPage] = useState(1);
    const [achievementFilterBy, setAchievementFilterBy] = useState<'all' | 'locked' | 'unlocked'>('all');
    const [achievementSortBy, setAchievementSortBy] = useState<'newestFirst' | 'oldestFirst' | 'alphabeticalAZ' | 'alphabeticalZA'>('newestFirst');

    const filterAchievements = (achievs: Achievement[]) => {
        switch (achievementFilterBy) {
            case 'locked':
                return achievs.filter(a => !a.achieved);
            case 'unlocked':
                return achievs.filter(a => a.achieved);
            case 'all':
            default:
                return achievs;
        }
    };

    const sortAchievements = (achievs: Achievement[]) => {
        const sorted = [...achievs];
        switch (achievementSortBy) {
            case 'alphabeticalAZ':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'alphabeticalZA':
                return sorted.sort((a, b) => b.name.localeCompare(a.name));
            case 'oldestFirst':
                return sorted.sort((a, b) => {
                    if (a.unlocktime && b.unlocktime) {
                        return a.unlocktime - b.unlocktime;
                    }
                    if (a.unlocktime && !b.unlocktime) {
                        return -1;
                    }
                    if (b.unlocktime && !a.unlocktime) {
                        return 1;
                    }
                    return 0;
                });
            case 'newestFirst':
            default:
                return sorted.sort((a, b) => (b.unlocktime || 0) - (a.unlocktime || 0));
        }
    };

    const fetchGameAchievementsData = useCallback(async (game: Game): Promise<Game> => {
        if (game.platform !== "steam" || !steamId) {
            return game;
        }

        try {
            const response = await fetch("/api/steam-achievements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ steamId, steamAppId: game.appid }),
            });

            if (!response.ok) {
                return game;
            }

            const data = await response.json();

            return {
                ...game,
                unlocked_achievements: data.response?.unlocked ?? undefined,
                total_achievements: data.response?.total ?? undefined,
            };
        } catch (error) {
            console.error(`Error fetching achievements for ${game.appid}:`, error);
            return game;
        }
    }, [steamId]);

    const fetchGameDetails = useCallback(async (game: Game): Promise<Game> => {
        if (game.platform !== "steam") {
            return game;
        }

        try {
            const response = await fetch("/api/steam-game-details", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ steamAppId: game.appid }),
            });

            if (!response.ok) {
                return game;
            }

            const data = await response.json();

            return {
                ...game,
                developer: data.response?.developer,
                genres: data.response?.genres,
                metacritic: data.response?.metacritic,
                esrb: data.response?.esrb,
                pegi: data.response?.pegi,
            };
        } catch (error) {
            console.error(`Error fetching details for ${game.appid}:`, error);
            return game;
        }
    }, []);
    
    useEffect(() => {
        const getCurrentSteamId = async () => {
            if (!isSteamConnected) {
                setSteamId(null);
                setLoading(false);
                return;
            }

            try {
                const { data: { user }, error: userError } = await supabase.auth.getUser();

                if (userError || !user) {
                    console.error("Failed to get user:", userError);
                    setSteamId(null);
                    setLoading(false);
                    return;
                }

                const steam_id = user.user_metadata?.steam_id;
                setSteamId(steam_id ?? null);
            } catch (error) {
                console.error("Error fetching user:", error);
                setSteamId(null);
            }
        };

        getCurrentSteamId();
    }, [isSteamConnected]);

    useEffect(() => {
        const fetchGames = async () => {
            try {
                setLoading(true);
                const allGames: Game[] = [];

                if (isSteamConnected && steamId) {
                    try {
                        const steamResponse = await fetch('/api/steam-owned-games', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ steamId }),
                        });

                        if (!steamResponse.ok) {
                            console.error('Failed to fetch Steam games:', steamResponse.statusText);
                        } else {
                            const steamData = await steamResponse.json();
                            const steamGames = (steamData.response?.games || []).map((game: Game) => ({
                                ...game,
                                platform: "steam" as const
                            }));
                            allGames.push(...steamGames);
                        }
                    } catch (error) {
                        console.error('Error fetching Steam games:', error);
                    }
                }

                if (isEpicConnected) {
                    try {
                        const epicResponse = await fetch('/data/EpicData.json');
                        const epicData = await epicResponse.json();
                        const epicGames = (epicData.epic?.games || []).map((game: Game) => ({
                            ...game,
                            platform: "epic" as const
                        }));
                        allGames.push(...epicGames);
                    } catch (error) {
                        console.error('Error fetching Epic games:', error);
                    }
                }

                // Filter for unplayed games
                const unplayedGames = allGames.filter(game => game.playtime_forever === 0);

                if (unplayedGames.length === 0) {
                    setGames([]);
                    setLoading(false);
                    return;
                }

                // Create a seeded random function based on current month/year
                const now = new Date();
                const monthYearSeed = now.getFullYear() * 12 + now.getMonth();
                
                // Shuffle unplayed games using seeded random
                const shuffled = [...unplayedGames].sort(() => {
                    // Simple seeded randomization using month/year
                    const seed = (monthYearSeed * 9301 + 49297) % 233280;
                    return (seed / 233280) - 0.5;
                });

                // Select first 3 (or less if not enough unplayed games)
                const recommended = shuffled.slice(0, 3);
                
                // Fetch achievements for each recommended game
                const gamesWithAchievements = await Promise.all(
                    recommended.map(game => fetchGameAchievementsData(game))
                );

                // Fetch details for each recommended game
                const gamesWithDetails = await Promise.all(
                    gamesWithAchievements.map(game => fetchGameDetails(game))
                );
                
                setGames(gamesWithDetails);
            } catch (error) {
                console.error('Error fetching games:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchGames();
    }, [isSteamConnected, isEpicConnected, steamId, fetchGameAchievementsData, fetchGameDetails]);

    if (loading) {
        return <p className="text-center text-(--secondary-text-color) mt-5">Loading recommended games...</p>;
    }

    if (games.length === 0) {
        return <p className="text-center text-(--secondary-text-color) mt-5">No unplayed games to recommend.</p>;
    }

    return (
        <div className="mt-5 bg-(--background-color) p-5 rounded-sm outline-2 outline-(--background-color2)">
            <div className="mb-4">
                <h3 className="text-2xl font-semibold mb-2">Monthly Recommended Games</h3>
                <p className='text-base text-(--secondary-text-color)'>
                    Three random unplayed games from your library, selected and updated monthly. Perfect for discovering something new to play this month.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {games.map((game) => (
                    <div 
                        key={game.appid} 
                        className="bg-(--background-color) rounded-sm overflow-hidden"
                        style={{boxShadow: `0 -1px 5px -1px var(--primary-color)`}}
                        >
                        <motion.img 
                            src={getGameHeaderUrl(game)} alt={game.name} 
                            className="w-full h-50 object-cover" 
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                            />
                        <div className="p-4">
                            <h3 className="text-lg font-semibold mb-2 text-(--primary-color)">{game.name}</h3>

                            <div className="flex justify-between items-center">
                                <p className="text-base text-(--secondary-text-color)">Developer:</p> 
                                <p className="text-base font-bold text-(--text-color)">{game.developer || "N/A"}</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-base text-(--secondary-text-color)">Genres:</p> 
                                <p className="text-base text-(--text-color)">{game.genres && game.genres.length > 0 ? game.genres.slice(0, 2).join(", ") : "N/A"}</p>
                            </div>
                            <div className="flex justify-between items-center mt-3">
                                <p className="text-base text-(--secondary-text-color)">ESRB Rating:</p> 
                                <p className="text-base text-(--text-color)">{game.esrb || "N/A"}</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-base text-(--secondary-text-color)">PEGI Rating:</p> 
                                <p className="text-base text-(--text-color)">{game.pegi || "N/A"}</p>
                            </div>
                            <div className="flex justify-between items-center mt-3">
                                <p className="text-base text-(--secondary-text-color)">Metacritic:</p> 
                                <p className="text-lg font-bold text-(--primary-color)">{game.metacritic ? `${game.metacritic}%` : "N/A"}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {achievementsModalOpen && selectedGameForAchievements && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-(--background-color) rounded-sm outline outline-white/10 w-full max-w-3xl max-h-[90vh] flex flex-col relative">
                        <div className="flex justify-between items-center p-5 gap-4">
                            <h3 className="text-xl font-semibold text-(--primary-color)">
                                {selectedGameForAchievements.name}
                            </h3>
                            <FontAwesomeIcon
                                icon={faRectangleXmark}
                                style={{ color: "#29bdff" }}
                                className="text-4xl cursor-pointer hover:opacity-80 shrink-0"
                                onClick={() => {
                                    setAchievementsModalOpen(false);
                                    setSelectedGameForAchievements(null);
                                    setAchievements([]);
                                    setCurrentAchievementsPage(1);
                                }}
                            />
                        </div>
                        <div className="flex items-center pr-5 pl-5 pb-5 gap-4">              
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    <span className="text-(--secondary-text-color) text-sm">
                                        Sort by:
                                    </span>
                                    <select
                                        value={achievementSortBy}
                                        onChange={(e) => {
                                            setAchievementSortBy(e.target.value as 'newestFirst' | 'oldestFirst' | 'alphabeticalAZ' | 'alphabeticalZA');
                                            setCurrentAchievementsPage(1);
                                        }}
                                        className="bg-(--background-inner-color) text-(--text-color) border border-white/20 rounded-sm pl-3 pr-8 py-2 focus:outline-none focus:border-white/40 appearance-none bg-no-repeat text-sm"
                                        style={{ backgroundImage: 'url("/icons/chevron-down.svg")', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
                                    >
                                        <option value="newestFirst">Newest First</option>
                                        <option value="oldestFirst">Oldest First</option>
                                        <option value="alphabeticalAZ">A to Z (Alphabetical)</option>
                                        <option value="alphabeticalZA">Z to A (Alphabetical)</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-(--secondary-text-color) text-sm">
                                        Filter by:
                                    </span>
                                    <select
                                        value={achievementFilterBy}
                                        onChange={(e) => {
                                            setAchievementFilterBy(e.target.value as 'all' | 'locked' | 'unlocked');
                                            setCurrentAchievementsPage(1);
                                        }}
                                        className="bg-(--background-inner-color) text-(--text-color) border border-white/20 rounded-sm pl-3 pr-8 py-2 focus:outline-none focus:border-white/40 appearance-none bg-no-repeat text-sm"
                                        style={{ backgroundImage: 'url("/icons/chevron-down.svg")', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
                                    >
                                        <option value="all">All Achievements</option>
                                        <option value="unlocked">Unlocked</option>
                                        <option value="locked">Locked</option>
                                    </select>
                                </div>
                            </div>                            
                        </div>

                        <div className="bg-(--background-inner-color) flex-1 p-4 overflow-hidden flex flex-col">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto flex-1">
                                {achievements.length > 0 ? (
                                    (() => {
                                        const itemsPerPage = 10;
                                        const filteredAndSortedAchievements = sortAchievements(filterAchievements(achievements));
                                        const startIndex = (currentAchievementsPage - 1) * itemsPerPage;
                                        const endIndex = startIndex + itemsPerPage;
                                        const paginatedAchievements = filteredAndSortedAchievements.slice(startIndex, endIndex);

                                        return paginatedAchievements.map((achievement, index) => (
                                            <div
                                                key={index}
                                                className={`p-3 rounded-sm border flex gap-3 ${
                                                    achievement.achieved
                                                        ? "bg-(--background-color) border-green-500/30 border-2"
                                                        : "bg-(--background-color) border-white/10"
                                                }`}
                                            >
                                                {achievement.icon && (
                                                    <img
                                                        src={achievement.achieved ? achievement.icon : achievement.icongray || achievement.icon}
                                                        alt={achievement.name}
                                                        className="w-15 h-15 rounded-sm shrink-0"
                                                    />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-(--text-color) text-lg">
                                                        {achievement.name}
                                                    </p>
                                                    {achievement.description && (
                                                        <p className="text-sm text-(--secondary-text-color) mt-1">
                                                            {achievement.description}
                                                        </p>
                                                    )}
                                                    <p className={`text-sm mt-2 ${
                                                        achievement.achieved
                                                            ? "text-green-400"
                                                            : "text-(--secondary-text-color)"
                                                    }`}>
                                                        {achievement.achieved && achievement.unlocktime > 0
                                                            ? `Unlocked ${epochToDate(achievement.unlocktime)}`
                                                            : "Not yet unlocked"}
                                                    </p>
                                                </div>
                                            </div>
                                        ));
                                    })()
                                ) : (
                                    <div className="col-span-full text-center py-10">
                                        <p className="text-(--secondary-text-color)">
                                            No achievements data available
                                        </p>
                                    </div>
                                )}
                            </div>

                            {achievements.length > 0 && (() => {
                                const filteredAndSortedAchievements = sortAchievements(filterAchievements(achievements));
                                const totalPages = Math.ceil(filteredAndSortedAchievements.length / 10);
                                return (
                                    <div className="p-4 mt-3 border-t border-(--disabled-color)/20">
                                        <div className="flex justify-between items-center">
                                            <button
                                                onClick={() => setCurrentAchievementsPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentAchievementsPage === 1}
                                                className="text-sm bg-(--primary-color) text-black px-4 py-2 rounded-sm hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                ← Previous
                                            </button>
                                            <span className="text-(--secondary-text-color) text-sm">
                                                Page {currentAchievementsPage} of {totalPages}
                                            </span>
                                            <button
                                                onClick={() => setCurrentAchievementsPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={currentAchievementsPage === totalPages}
                                                className="text-sm bg-(--primary-color) text-black px-4 py-2 rounded-sm hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Next →
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}