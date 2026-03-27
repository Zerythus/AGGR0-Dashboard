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
    const modalRef = useRef<HTMLDivElement>(null);

    // Reset to page 1 when category changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, filteredGames.length]);

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
    }, [selectedCategory, onClose]);

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
        <>
            {/* Modal Backdrop */}
            <div 
                className="fixed inset-0 bg-black/60 z-40"
            />
            
            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div 
                    ref={modalRef}
                    className="bg-(--background-color) rounded-sm outline outline-white/10 w-full max-w-4xl h-50vh flex flex-col"
                >
                    <div className='flex justify-between'>
                        <div className="flex justify-between items-center gap-1 p-5">
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
