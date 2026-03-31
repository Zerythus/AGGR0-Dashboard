import { useOutletContext } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getRandomGreeting } from '@/utils/greetingHelper';

import MetricCard from '../components/metricCards';
import GamePicker from '@/components/gamePicker';
import TopGames from '@/components/top3Games';
import CostPerHour from '@/components/costPerHour';
import GamesOwnedChart from '@/components/gamesOwnedChart';
import GamesCategoryList from '@/components/gamesCategoryList';

interface Game {
    appid: number;
    name: string;
    playtime_forever: number;
    rtime_last_played: number;
}

export default function DashboardFill() {
    const { username } = useOutletContext<{ username: string }>();
    const [greeting, setGreeting] = useState('Welcome');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [filteredGames, setFilteredGames] = useState<Game[]>([]);
    const [isSteamConnected] = useState(() => {
        const syncedPlatforms = localStorage.getItem("syncedPlatforms");
        if (syncedPlatforms) {
            const parsed = JSON.parse(syncedPlatforms);
            return parsed["Steam"] === true;
        }
        return false;
    });
    const [isEpicConnected] = useState(() => {
        const syncedPlatforms = localStorage.getItem("syncedPlatforms");
        if (syncedPlatforms) {
            const parsed = JSON.parse(syncedPlatforms);
            return parsed["Epic Games"] === true;
        }
        return false;
    });

    useEffect(() => {
        const loadGreeting = async () => {
            const loginCount = parseInt(localStorage.getItem('loginCount') || '1', 10);
            const randomGreeting = await getRandomGreeting(username, loginCount);
            setGreeting(randomGreeting);
        };
        loadGreeting();
    }, [username]);

    const handleBarClick = (category: string, games: Game[]) => {
        setSelectedCategory(category);
        setFilteredGames(games);
    };

    const handleCloseList = () => {
        setSelectedCategory(null);
        setFilteredGames([]);
    };

    return (
        <>
            {!isSteamConnected && !isEpicConnected ? (
                <div className="px-4 sm:px-6 lg:px-8 mt-5">
                    <div>
                        <h2 className="text-3xl font-bold text-(--text-color)">Welcome, {username}!</h2>
                    </div>
                </div>
            ) : (
                /* max width to control content stretching on large screens, and padding on sides */
                <div className="px-4 sm:px-6 lg:px-8 max-w-350 mx-auto mt-5">
                    <h2 className="text-4xl font-bold text-(--text-color)">{greeting}</h2>

                    {/* Grid container for metric cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10 w-full">
                        <MetricCard metric="totalGames" label="TOTAL GAMES" isSteamConnected={isSteamConnected} isEpicConnected={isEpicConnected} />
                        <MetricCard metric="unplayedGames" label="UNPLAYED GAMES" isSteamConnected={isSteamConnected} isEpicConnected={isEpicConnected} />
                        <MetricCard metric="totalHours" label="TOTAL PLAYTIME" unit="hrs" isSteamConnected={isSteamConnected} isEpicConnected={isEpicConnected} />
                    </div>

                    {/* MONITOR UP TO 3 GAMES */}
                    <GamePicker isSteamConnected={isSteamConnected} isEpicConnected={isEpicConnected} />

                    {/* Games owned chart with cost per hour on the right */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5 w-full">
                        <div className="lg:col-span-2">
                            <GamesOwnedChart onBarClick={handleBarClick} isSteamConnected={isSteamConnected} isEpicConnected={isEpicConnected} />
                        </div>
                        <div className='lg:col-span-1'>
                            <CostPerHour isSteamConnected={isSteamConnected} isEpicConnected={isEpicConnected} />
                        </div>
                    </div>

                    {/* Games Category List */}
                    <div className="mt-5 w-full">
                        <GamesCategoryList
                            selectedCategory={selectedCategory}
                            filteredGames={filteredGames}
                            onClose={handleCloseList}
                        />
                    </div>

                    {/* Most Played Games */}
                    <TopGames isSteamConnected={isSteamConnected} isEpicConnected={isEpicConnected} />

                    <div className='mb-10'>
                        {/* Just footer space here */}
                    </div>
                </div>
            )}
        </>
    );

}