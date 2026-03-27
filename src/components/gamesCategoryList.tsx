import { useState, useEffect } from 'react';

interface Game {
    appid: number;
    name: string;
    playtime_forever: number;
    rtime_last_played: number;
    header_image?: string;
    image?: string;
    img_icon_url?: string;
}

interface GamesCategoryListProps {
    selectedCategory: string | null;
    filteredGames: Game[];
    onClose: () => void;
}

export default function GamesCategoryList({
    selectedCategory,
    filteredGames,
    onClose,
}: GamesCategoryListProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Reset to page 1 when category changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, filteredGames.length]);

    if (!selectedCategory) {
        return null;
    }

    const totalPages = Math.ceil(filteredGames.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedGames = filteredGames.slice(startIndex, endIndex);

const minutesToHours = (minutes: number) => {
    return Math.round((minutes / 60) * 10) / 10; // Round to 1 decimal place
};

function getGameIconUrl(appid: number, img_icon_url: string): string {
    return `https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/${appid}/${img_icon_url}.jpg`;
}

    return (
        <div className="mt-5 bg-(--background-color) p-5 rounded-sm outline outline-white/10 w-full mx-auto h-50vh">
            {filteredGames.length > 0 ? (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xl font-semibold text-(--text-color)">
                            Games in "{selectedCategory}" category ({filteredGames.length})
                        </h4>
                        <button
                            onClick={onClose}
                            className="text-sm bg-(--hover-primary-color) text-black px-3 py-1 rounded-sm hover:opacity-80"
                        >
                            Close
                        </button>
                    </div>
                    <div className="bg-(--background-inner-color) rounded-sm p-4 h-5/6 flex flex-col">
                        <ul className="flex-1 space-y-2">
                            {paginatedGames.map((game) => (
                                <li
                                    key={game.appid}
                                    className="text-(--text-color) py-2 px-2 border-b border-(--disabled-color)/10"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-5 items-start">
                                            <div className="h-6 w-6 overflow-hidden rounded-sm bg-slate-200">
                                                <img
                                                src={
                                                    game.header_image ||
                                                    game.image ||
                                                    getGameIconUrl(Number(game.appid), game.img_icon_url || "")
                                                }
                                                alt={game.name}
                                                className="h-full w-full object-cover"
                                                />
                                            </div>
                                            <span className="font-medium">{game.name}</span>
                                            
                                        </div>
                                        <div>
                                            <span className="text-(--secondary-text-color)">
                                                {minutesToHours(game.playtime_forever)} hours
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        
                        {/* Pagination Controls */}
                        <div className="flex justify-between items-center mt-4 pt-4">
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
                </>
            ) : (
                <div className="mt-8 text-center text-(--secondary-text-color)">
                    <p>No games found in the "{selectedCategory}" category</p>
                    <button
                        onClick={onClose}
                        className="text-sm bg-(--hover-primary-color) text-black px-3 py-1 rounded-sm hover:opacity-80 mt-4"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
}
