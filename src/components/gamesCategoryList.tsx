import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons/faRectangleXmark";

import { useState, useEffect, useRef } from 'react';

interface Game {
    appid: number;
    name: string;
    playtime_forever: number;
    rtime_last_played: number;
    header_image?: string;
    image?: string;
    platform?: "steam" | "epic"; //Track which platform the game came from
    img_icon_url?: string;
    total_achievements?: number;
    unlocked_achievements?: number;
    retail_price?: number;
}

interface GamesCategoryListProps {
    selectedCategory: string | null;
    filteredGames: Game[];
    onClose: () => void;
    isSteamConnected?: boolean;
    isEpicConnected?: boolean;
}

export default function GamesCategoryList({
    selectedCategory,
    filteredGames,
    onClose,
    isSteamConnected = true,
    isEpicConnected = true,
}: GamesCategoryListProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState<'nameAZ' | 'nameZA' | 'hoursLow' | 'hoursHigh'>('hoursHigh');
    const [filterBy, setFilterBy] = useState<'all' | 'steam' | 'epic'>('all');
    const itemsPerPage = 10;
    const modalRef = useRef<HTMLDivElement>(null);

    // Reset to page 1 when category changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory]);

    const sortGames = (games: Game[]) => {
        const sorted = [...games];
        switch (sortBy) {
            case 'nameAZ':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'nameZA':
                return sorted.sort((a, b) => b.name.localeCompare(a.name));
            case 'hoursLow':
                return sorted.sort((a, b) => a.playtime_forever - b.playtime_forever);
            case 'hoursHigh':
                return sorted.sort((a, b) => b.playtime_forever - a.playtime_forever);
            default:
                return sorted;
        }
    };

    const filterGames = (games: Game[]) => {
        switch (filterBy) {
            case 'steam':
                return games.filter(game => game.platform === "steam");
            case 'epic':
                return games.filter(game => game.platform === "epic");
            case 'all':
            default:
                return games;
        }
    };

    useEffect(() => {
        function handleEscKey(e: KeyboardEvent) {
            if (e.key === "Escape") {
                onClose();
            }
        }

        function handleClickOutside(event: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        }

        if (selectedCategory) {
            document.addEventListener("keydown", handleEscKey);
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("keydown", handleEscKey);
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }
    }, [selectedCategory, onClose, sortBy]);

    if (!selectedCategory) {
        return null;
    }

    const gamesByPlatform = filterGames(filteredGames);
    const finalSortedGames = sortGames(gamesByPlatform);
    const totalPages = Math.ceil(finalSortedGames.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedGames = finalSortedGames.slice(startIndex, endIndex);

const minutesToHours = (minutes: number) => {
    return Math.round((minutes / 60) * 10) / 10; // Round to 1 decimal place
};

function getGameIconUrl(appid: number, img_icon_url: string, platform?: "steam" | "epic"): string {
    if (platform === "epic") {
        return "/icons/epic-games.svg";
    }
    // Default to Steam CDN for steam games

    return `https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/${appid}/${img_icon_url}.jpg`; // Do not change this url for Steam
}


    return (
        <>
            {/* Modal Backdrop */}
            <div 
                className="fixed inset-0 bg-black/60 z-40"
            />
            
            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div 
                    ref={modalRef}
                    className="bg-(--background-color) rounded-sm outline outline-white/10 w-full max-w-5xl h-50vh flex flex-col"
                >
                    <div className='flex justify-between items-center p-5'>
                        <div className="flex items-center gap-1">
                            <h4 className="text-xl font-semibold text-(--text-color)">
                                Games in 
                            </h4>
                            <h4 className='text-xl font-semibold text-(--primary-color)'>
                                {selectedCategory}
                            </h4>
                            <h4 className="text-xl font-semibold text-(--text-color)">
                                category
                            </h4> 
                            
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-(--secondary-text-color) ml-3">
                                Sort by:
                            </span>
                            <select
                                value={sortBy}
                                onChange={(e) => {
                                    setSortBy(e.target.value as 'nameAZ' | 'nameZA' | 'hoursLow' | 'hoursHigh');
                                }}
                                className="bg-(--background-inner-color) text-(--text-color) border border-white/20 rounded-sm pl-3 pr-8 py-2 focus:outline-none focus:border-white/40 appearance-none bg-no-repeat"
                                style={{ backgroundImage: 'url("/icons/chevron-down.svg")', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
                            >
                                <option value="nameAZ">A to Z (Alphabetical)</option>
                                <option value="nameZA">Z to A (Alphabetical)</option>
                                <option value="hoursLow">Low to High Hours</option>
                                <option value="hoursHigh">High to Low Hours</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-1">
                            <span className="text-(--secondary-text-color) ml-3">
                                Filter by:
                            </span>
                            <select
                                value={filterBy}
                                onChange={(e) => {
                                    setFilterBy(e.target.value as 'all' | 'steam' | 'epic');
                                }}
                                className="bg-(--background-inner-color) text-(--text-color) border border-white/20 rounded-sm pl-3 pr-8 py-2 focus:outline-none focus:border-white/40 appearance-none bg-no-repeat disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundImage: 'url("/icons/chevron-down.svg")', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
                            >
                                <option value="all">All Games</option>
                                <option value="steam" disabled={!isSteamConnected}>Steam Games</option>
                                <option value="epic" disabled={!isEpicConnected}>Epic Games</option>
                            </select>
                        </div>

                        <FontAwesomeIcon 
                            icon={faRectangleXmark} 
                            style={{color: "#29bdff",}}
                            className="text-4xl cursor-pointer hover:opacity-80"
                            onClick={(onClose)}
                        />
                    </div>
                    
                    <div className="bg-(--background-inner-color) flex-1 p-4 overflow-hidden flex flex-col">
                        <ul className="flex-1 space-y-2">
                            {paginatedGames.map((game) => (
                                <li
                                    key={game.appid}
                                    className="text-(--text-color) py-2 px-2 border-b border-(--disabled-color)/10"
                                >
                                    <div className="flex justify-between items-center gap-4 w-full">
                                        <div className="flex gap-3 items-center min-w-0">
                                            <div className="rounded-sm shrink-0">
                                                <img
                                                    src={
                                                        game.platform === "epic"
                                                            ? "/icons/epic-games.svg"
                                                            : (game.header_image || game.image || getGameIconUrl(Number(game.appid), game.img_icon_url || "", game.platform))
                                                    }
                                                    alt={game.name}
                                                    className="w-6 h-6 inline mr-2"
                                                />
                                            </div>
                                            <p className="font-medium truncate">{game.name}</p>
                                        </div>
                                        <div className="text-center min-w-fit">
                                            <span className="text-(--secondary-text-color)">
                                                {game.retail_price ? `$${game.retail_price.toFixed(2)} CAD` : "N/A"}
                                            </span>
                                        </div>
                                        <div className="text-center min-w-fit">
                                            {game.total_achievements ? (
                                                <span className="text-(--secondary-text-color)">
                                                    {game.unlocked_achievements || 0}/{game.total_achievements}
                                                </span>
                                            ) : (
                                                <span className="text-(--secondary-text-color) text-sm">
                                                    N/A
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right min-w-fit">
                                            <span className="text-(--secondary-text-color)">
                                                {minutesToHours(game.playtime_forever)}h
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Pagination Controls */}
                    <div className="p-4">
                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="text-sm bg-(--primary-color) text-black px-4 py-2 rounded-sm hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ← Previous
                            </button>
                            <span className="text-(--secondary-text-color) text-sm">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="text-sm bg-(--primary-color) text-black px-4 py-2 rounded-sm hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
