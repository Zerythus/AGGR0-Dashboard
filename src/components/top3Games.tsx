import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Game = {
    appid: number;
    name: string;
    playtime_forever: number; //Hours played
    rtime_last_played: number; //Epoch time of last played date
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

function getGameHeaderUrl(appid: number): string {
    return `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`;
}

export default function TopGames() {
    const [games, setGames] = useState<Game[]>([]);
    
    useEffect(() => {
        fetch("/public/data/SampleData.json")
            .then((r) => r.json())
            .then((json) => {
                const allGames: Game[] = json.response.games;
                const top3 = allGames
                    .sort((a, b) => b.playtime_forever - a.playtime_forever)
                    .slice(0, 3);
                setGames(top3);
            })
    }, []);

    if (games.length === 0) {
        return <p className="text-center text-gray-500">No games played yet.</p>;
    }

    return (
        <div className="mt-5 bg-(--background-color) p-5 rounded-sm outline-2 outline-(--background-color2)">
            <div className="mb-4">
                <h3 className="text-2xl font-semibold mb-2">Most Played Games</h3>
                <p className='text-base text-gray-300'>
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
                            src={getGameHeaderUrl(game.appid)} alt={game.name} 
                            className="w-full h-50 object-cover" 
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                            />
                        <div className="p-4">
                            <h3 className="text-lg font-semibold text-(--primary-color)">{game.name}</h3>

                            <div className="flex justify-between items-center">
                                <p className="text-base text-(--disabled-color)">Playtime:</p> 
                                <p className="text-base text-(--disabled-color)"> {minToHours(game.playtime_forever)} hours</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-base text-(--disabled-color)">Last Played:</p> 
                                <p className="text-base text-(--disabled-color)"> {epochToDate(game.rtime_last_played)}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}