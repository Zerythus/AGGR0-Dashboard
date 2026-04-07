import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAccessibility } from '../contexts/AccessibilityContext';

interface Game {
    appid: number;
    name: string;
    playtime_forever: number;
    rtime_last_played: number;
    platform?: "steam" | "epic";
}

interface GamesOwnedChartProps {
    onBarClick?: (category: string, games: Game[]) => void;
    isSteamConnected?: boolean;
    isEpicConnected?: boolean;
}

// Playtime category constants
const PLAYTIME_CATEGORIES = [
    { min: 0, max: 0, label: 'Unplayed' },
    { min: 1, max: 60, label: '<1' },
    { min: 61, max: 300, label: '1-5' },
    { min: 301, max: 600, label: '5-10' },
    { min: 601, max: 900, label: '10-15' },
    { min: 901, max: 1500, label: '15-25' },
    { min: 1501, max: 3000, label: '25-50' },
    { min: 3001, max: 6000, label: '50-100' },
    { min: 6001, max: Infinity, label: '100+' }
];

export default function GamesOwnedChart({ onBarClick, isSteamConnected = true, isEpicConnected = false }: GamesOwnedChartProps) {
    const { settings } = useAccessibility();
    const [playtimeCategoryData, setPlaytimeCategoryData] = useState<{ category: string; count: number; }[]>([]);
    const [allGames, setAllGames] = useState<Game[]>([]);

    // Calculate chart height based on font size level
    const chartHeightMap: { [key: number]: number } = {
        2: 500,  // Small
        3: 550,  // Medium (default)
        4: 600,  // Large
    };
    const chartHeight = chartHeightMap[settings.fontSizeLevel] || 600;

    useEffect(() => {
        const fetchData = async () => {
            try {
                let allGamesData: Game[] = [];

                // Fetch Steam data if connected
                if (isSteamConnected) {
                    try {
                        const steamResponse = await fetch('data/SteamData.json');
                        const steamData = await steamResponse.json();
                        const steamGames: Game[] = (steamData.steam?.games || []).map((game: Game) => ({
                            ...game,
                            platform: "steam"
                        }));
                        allGamesData = [...allGamesData, ...steamGames];
                    } catch (error) {
                        console.error('Error loading Steam data:', error);
                    }
                }

                // Fetch Epic data if connected
                if (isEpicConnected) {
                    try {
                        const epicResponse = await fetch('data/EpicData.json');
                        const epicData = await epicResponse.json();
                        const epicGames: Game[] = (epicData.epic?.games || []).map((game: Game) => ({
                            ...game,
                            platform: "epic"
                        }));
                        allGamesData = [...allGamesData, ...epicGames];
                    } catch (error) {
                        console.error('Error loading Epic data:', error);
                    }
                }

                setAllGames(allGamesData);

                // Count games by time played categories
                const categoryCounts = PLAYTIME_CATEGORIES.map(cat => ({
                    category: cat.label,
                    count: 0
                }));

                allGamesData.forEach((game) => {
                    const playtimeMinutes = game.playtime_forever;
                    
                    for (let i = 0; i < PLAYTIME_CATEGORIES.length; i++) {
                        const cat = PLAYTIME_CATEGORIES[i];
                        if (playtimeMinutes >= cat.min && playtimeMinutes <= cat.max) {
                            categoryCounts[i].count++;
                            break;
                        }
                    }
                });

                setPlaytimeCategoryData(categoryCounts);
            } catch (error) {
                console.error('Error loading data:', error);
                setPlaytimeCategoryData([]);
            }
        };

        fetchData();
    }, [isSteamConnected, isEpicConnected]);

    const handleBarClick = (props: any) => {
        if (!onBarClick || !props.payload) return;

        const data = props.payload;
        const categoryInfo = PLAYTIME_CATEGORIES.find(cat => cat.label === data.category);
        if (categoryInfo) {
            const games = allGames.filter(game => {
                const playtimeMinutes = game.playtime_forever;
                return playtimeMinutes >= categoryInfo.min && playtimeMinutes <= categoryInfo.max;
            });
            onBarClick(data.category, games);
        }
    };

    return (
        <div className="bg-(--background-color) p-5 rounded-sm outline outline-white/10 w-full mx-auto h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-semibold text-(--disabled-color)">Number of games owned per playtime (hours)</h3>  
            </div>
            <p className='text-base text-(--secondary-text-color)'>
                This chart categorizes your owned games based on your total playtime. It helps identify how many games you've never played, lightly played, or heavily invested time in. <i>Click on any bar to see the specific games in that category.</i>
            </p>
            <ResponsiveContainer 
                width="100%" 
                height={chartHeight}
            >
                <BarChart
                    width={1000}
                    height={chartHeight}
                    data={playtimeCategoryData}
                    margin={{ top: 20, right: 0, left: 10, bottom: 35 }}
                >
                    <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--primary-color)" />
                            <stop offset="100%" stopColor="white" />
                        </linearGradient>
                    </defs>
                    <XAxis 
                        dataKey="category" 
                        stroke="white"
                        label={{ value: 'Playtime Category (hours)', position: 'insideBottom', fill: 'white', offset: -30 }}
                    />
                    <YAxis 
                        dataKey="count" 
                        width="auto" 
                        allowDecimals={false} 
                        interval={0} 
                        tickCount={Math.min(10, playtimeCategoryData.length + 1)}
                        stroke='white'
                        label={{ value: 'Number of Games', angle: -90, position: 'insideLeft', fill: 'white' }}
                    />
                    <Tooltip 
                        wrapperStyle={{ backgroundColor: '#fff' }}
                        contentStyle={{
                            backgroundColor: 'var(--background-inner-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            borderRadius: '4px',
                            border: '1px solid white',
                        }}
                        cursor={false}
                    />
                    <Legend 
                        verticalAlign="top"
                        align="right"
                        height={36}
                    />
                    <Bar 
                        dataKey="count" 
                        name="Games Count" 
                        fill="url(#colorGradient)" 
                        radius={[5, 5, 0, 0]} 
                        activeBar={{ fill: "var(--hover-primary-color)", stroke: "var(--text-color)", strokeWidth: 3, cursor: "pointer" }}
                        onClick={(data) => handleBarClick(data)}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
