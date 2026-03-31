import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Game = {
    appid: number;
    name: string;
    playtime_forever: number; //Hours played
    rtime_last_played: number; //Epoch time of last played date
    total_achievements?: number;
    unlocked_achievements?: number;
    platform?: "steam" | "epic";
    image_url?: string;
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
    
    useEffect(() => {
        const fetchGames = async () => {
            try {
                const allGames: Game[] = [];

                if (isSteamConnected) {
                    const steamResponse = await fetch("/data/SteamData.json");
                    const steamData = await steamResponse.json();
                    const steamGames = (steamData.steam?.games || []).map((game: Game) => ({
                        ...game,
                        platform: "steam"
                    }));
                    allGames.push(...steamGames);
                }

                if (isEpicConnected) {
                    const epicResponse = await fetch("/data/EpicData.json");
                    const epicData = await epicResponse.json();
                    const epicGames = (epicData.epic?.games || []).map((game: Game) => ({
                        ...game,
                        platform: "epic"
                    }));
                    allGames.push(...epicGames);
                }

                const top3 = allGames
                    .sort((a, b) => b.playtime_forever - a.playtime_forever)
                    .slice(0, 3);
                setGames(top3);
            } catch (error) {
                console.error("Error fetching games:", error);
            }
        };
        fetchGames();
    }, [isSteamConnected, isEpicConnected]);

    if (games.length === 0) {
        return <p className="text-center text-gray-500">No games played yet.</p>;
    }

    return (
        <div className="mt-5 bg-(--background-color) p-5 rounded-sm outline-2 outline-(--background-color2)">
            <div className="mb-4">
                <h3 className="text-2xl font-semibold mb-2">Most Played Games</h3>
                <p className='text-base text-(--secondary-text-color)'>
                    Your top 3 most played games based on total playtime, and when you last played them while connected online in your chosen platform.
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
                            <h3 className="text-lg font-semibold text-(--primary-color)">{game.name}</h3>

                            <div className="flex justify-between items-center">
                                <p className="text-base text-(--secondary-text-color)">Playtime:</p> 
                                <p className="text-base text-(--text-color)"> {minToHours(game.playtime_forever)} hours</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-base text-(--secondary-text-color)">Last Played:</p> 
                                <p className="text-base text-(--text-color)"> {epochToDate(game.rtime_last_played)}</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-base text-(--secondary-text-color)">Achievements:</p>
                                <p className="text-base text-(--text-color)"> {game.unlocked_achievements || 0} / {game.total_achievements || 0} completed</p>
                            </div>
                            <div className="flex justify-between items-center mt-5">
                                <p className="text-base text-(--secondary-text-color)">Gaming Platform:</p>
                                <p className="text-base text-(--text-color)"> {game.platform === "epic" ? "Epic Games" : "Steam"}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}