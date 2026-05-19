import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons/faRectangleXmark";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import styles from './gamesCategoryList.module.css';

interface Game {
    appid: number;
    name: string;
    playtime_forever: number;
    rtime_last_played: number;
    header_image?: string;
    image?: string;
    platform?: "steam"; //Track which platform the game came from
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

}

export default function GamesCategoryList({
    selectedCategory,
    filteredGames,
    onClose,
    isSteamConnected = true,
}: GamesCategoryListProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState<'nameAZ' | 'nameZA' | 'hoursLow' | 'hoursHigh' | 'priceLow' | 'priceHigh'>('hoursHigh');
    const [filterBy, setFilterBy] = useState<'all' | 'steam'>('all');
    const [enrichedGames, setEnrichedGames] = useState<Game[]>(filteredGames);
    const [isLoading, setIsLoading] = useState(false);
    const itemsPerPage = 10;
    const modalRef = useRef<HTMLDivElement>(null);

    // Reset to page 1 when category changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory]);

    // Lazy load achievements and prices when modal opens
    useEffect(() => {
        if (!selectedCategory || filteredGames.length === 0) {
            setEnrichedGames(filteredGames);
            return;
        }

        const enrichGames = async () => {
            setIsLoading(true);
            try {
                // Get steamId from Supabase
                const { data: { user } } = await supabase.auth.getUser();
                const steamId = user?.user_metadata?.steam_id;

                const enrichedGamesList = await Promise.all(
                    filteredGames.map(async (game) => {
                        // Skip if already enriched
                        if (game.total_achievements !== undefined && game.retail_price !== undefined) {
                            return game;
                        }

                        try {
                            // Fetch achievements for Steam games
                            const achievementsResponse = await fetch('/api/steam-achievements', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                    steamId, 
                                    steamAppId: game.appid 
                                }),
                            });
                            const achievementsData = await achievementsResponse.json();
                            const achievements = achievementsData.response;

                            // Fetch price for Steam games
                            const priceResponse = await fetch('/api/steam-price', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ steamAppId: game.appid }),
                            });
                            const priceData = await priceResponse.json();
                            const price = priceData.response;

                            return {
                                ...game,
                                total_achievements: achievements?.total,
                                unlocked_achievements: achievements?.unlocked,
                                retail_price: price?.price
                            };
                        } catch (error) {
                            console.error(`Error enriching game ${game.appid}:`, error);
                            return game;
                        }
                    })
                );
                setEnrichedGames(enrichedGamesList);
            } catch (error) {
                console.error('Error enriching games:', error);
                setEnrichedGames(filteredGames);
            } finally {
                setIsLoading(false);
            }
        };

        enrichGames();
    }, [selectedCategory, filteredGames]);

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
            case 'priceLow':
                return sorted.sort((a, b) => (a.retail_price ?? 0) - (b.retail_price ?? 0));
            case 'priceHigh':
                return sorted.sort((a, b) => (b.retail_price ?? 0) - (a.retail_price ?? 0));
            default:
                return sorted;
        }
    };

    const filterGames = (games: Game[]) => {
        switch (filterBy) {
            case 'steam':
                return games.filter(game => game.platform === "steam");
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

    const gamesByPlatform = filterGames(enrichedGames);
    const finalSortedGames = sortGames(gamesByPlatform);
    const totalPages = Math.ceil(finalSortedGames.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedGames = finalSortedGames.slice(startIndex, endIndex);

const minutesToHours = (minutes: number) => {
    return Math.round((minutes / 60) * 10) / 10; // Round to 1 decimal place
};

function getGameIconUrl(appid: number, img_icon_url: string): string {
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
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 min-h-screen">
                <div 
                    ref={modalRef}
                    className={`bg-(--background-color) rounded-sm outline outline-white/10 w-full max-w-5xl flex flex-col my-auto ${styles.categoryModal}`}
                >
                    <div className={`flex justify-between items-center p-5 ${styles.headerSection}`}>
                        <div className="flex items-center gap-1">
                            <h4 className='text-xl font-semibold text-(--primary-color)'>
                                {selectedCategory}
                            </h4>
                            <h4 className="text-xl font-semibold text-(--text-color)">
                                games
                            </h4> 
                            
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-(--secondary-text-color) ml-3">
                                Sort by:
                            </span>
                            <select
                                value={sortBy}
                                onChange={(e) => {
                                    setSortBy(e.target.value as 'nameAZ' | 'nameZA' | 'hoursLow' | 'hoursHigh' | 'priceLow' | 'priceHigh');
                                }}
                                className="bg-(--background-inner-color) text-(--text-color) border border-white/20 rounded-sm pl-3 pr-8 py-2 focus:outline-none focus:border-white/40 appearance-none bg-no-repeat"
                                style={{ backgroundImage: 'url("/icons/chevron-down.svg")', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
                            >
                                <option value="nameAZ">A to Z (Alphabetical)</option>
                                <option value="nameZA">Z to A (Alphabetical)</option>
                                <option value="hoursLow">Low to High Hours</option>
                                <option value="hoursHigh">High to Low Hours</option>
                                <option value="priceLow">Low to High Price</option>
                                <option value="priceHigh">High to Low Price</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-1">
                            <span className="text-(--secondary-text-color) ml-3">
                                Filter by:
                            </span>
                            <select
                                value={filterBy}
                                onChange={(e) => {
                                    setFilterBy(e.target.value as 'all' | 'steam');
                                }}
                                className="bg-(--background-inner-color) text-(--text-color) border border-white/20 rounded-sm pl-3 pr-8 py-2 focus:outline-none focus:border-white/40 appearance-none bg-no-repeat disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundImage: 'url("/icons/chevron-down.svg")', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
                            >
                                <option value="all">All Games</option>
                                <option value="steam" disabled={!isSteamConnected}>Steam Games</option>
                            </select>
                        </div>

                        <FontAwesomeIcon 
                            icon={faRectangleXmark} 
                            style={{color: "#29bdff",}}
                            className="text-4xl cursor-pointer hover:opacity-80"
                            onClick={(onClose)}
                        />
                    </div>
                    
                    <div className={`bg-(--background-inner-color) flex-1 p-4 flex flex-col ${styles.contentArea}`}>
                        {isLoading && (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-(--secondary-text-color)">Loading game details...</p>
                            </div>
                        )}
                        {!isLoading && (
                            <>
                                <div className={styles.gameListRow}>
                                    {/* Column Headers */}
                                    <div className="flex items-center gap-4 w-full pb-3 border-b border-white/20 mb-2">
                                        <div className="flex-1 text-sm font-semibold text-(--secondary-text-color)">
                                            Game Name
                                        </div>
                                        <div className="w-28 text-center text-sm font-semibold text-(--secondary-text-color)">
                                            Retail Price
                                        </div>
                                        <div className="w-28 text-center text-sm font-semibold text-(--secondary-text-color)">
                                            Achievements
                                        </div>
                                        <div className="w-20 text-right text-sm font-semibold text-(--secondary-text-color)">
                                            Playtime
                                        </div>
                                    </div>

                                    {/* Game List */}
                                    <ul className="space-y-2">
                                        {paginatedGames.map((game) => (
                                            <li
                                                key={game.appid}
                                                className="text-(--text-color) py-2 px-2 border-b border-(--disabled-color)/10"
                                            >
                                                <div className="flex items-center gap-4 w-full">
                                                <div className="flex-1 flex gap-3 items-center min-w-0">
                                                    <div className="rounded-sm shrink-0">
                                                        <img
                                                            src={
                                                                game.header_image || game.image || getGameIconUrl(Number(game.appid), game.img_icon_url || \"\")
                                                            }
                                                            alt={game.name}
                                                            className="w-6 h-6 inline mr-2"
                                                        />
                                                    </div>
                                                    <p className="font-medium truncate">{game.name}</p>
                                                </div>
                                                <div className="w-28 text-center">
                                                    <span className="text-(--secondary-text-color)">
                                                        {game.retail_price ? `$${game.retail_price.toFixed(2)}` : "N/A"}
                                                    </span>
                                                </div>
                                                <div className="w-28 text-center">
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
                                                <div className="w-20 text-right">
                                                    <span className="text-(--secondary-text-color)">
                                                        {minutesToHours(game.playtime_forever)}h
                                                    </span>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                    </ul>
                                </div>
                            </>
                        )}
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
