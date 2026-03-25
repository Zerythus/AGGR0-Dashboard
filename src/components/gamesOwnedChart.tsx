import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Game {
    appid: number;
    name: string;
    playtime_forever: number;
    rtime_last_played: number;
}

// Playtime category constants
const PLAYTIME_CATEGORIES = [
    { min: 0, max: 0, label: 'Unplayed' },
    { min: 1, max: 60, label: '<1 hr' },
    { min: 61, max: 300, label: '1-5 hrs' },
    { min: 301, max: 600, label: '5-10 hrs' },
    { min: 601, max: 900, label: '10-15 hrs' },
    { min: 901, max: 1500, label: '15-25 hrs' },
    { min: 1501, max: 3000, label: '25-50 hrs' },
    { min: 3001, max: 6000, label: '50-100 hrs' },
    { min: 6001, max: Infinity, label: '100+ hrs' }
];

export default function GamesOwnedChart() {
    const dataUrl = `data/SampleData.json`;
    const [playtimeCategoryData, setPlaytimeCategoryData] = useState<{ category: string; count: number; }[]>([]);

    useEffect(() => {
        fetch(dataUrl)
            .then((response) => response.json())
            .then((jsonData) => {
                const games: Game[] = jsonData.response?.games || [];

                // Count games by time played categories
                const categoryCounts = PLAYTIME_CATEGORIES.map(cat => ({
                    category: cat.label,
                    count: 0
                }));

                games.forEach((game) => {
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
            })
            .catch((error) => {
                console.error('Error loading data:', error);
                setPlaytimeCategoryData([]);
            });
    }, [dataUrl]);

    return (
        <div className="bg-(--background-color) p-5 rounded-sm outline outline-white/10 w-full mx-auto h-full">
            <h3 className="text-2xl font-semibold mb-4">Number of games owned per playtime (hours)</h3>
            <p className='text-base text-gray-300'>
                This chart categorizes your owned games based on total playtime, giving you a visual overview of how many games you've played for different durations. It helps identify how many games you've never played, lightly played, or heavily invested time in.
            </p>
            <ResponsiveContainer 
                width="100%" 
                height={500}
            >
                <BarChart
                    width={1000}
                    height={500}
                    data={playtimeCategoryData}
                    margin={{ top: 20, right: 0, left: 10, bottom: 20 }}
                >
                    <XAxis 
                        dataKey="category" 
                        stroke="white"
                        label={{ value: 'Playtime Category', position: 'insideBottom', fill: 'white', offset: -15 }}
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
                    <Bar 
                        dataKey="count" 
                        name="Games Count" 
                        fill="var(--primary-color)" 
                        radius={[5, 5, 0, 0]} 
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
