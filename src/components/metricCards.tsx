import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGamepad } from "@fortawesome/free-solid-svg-icons";
import { faClock } from "@fortawesome/free-solid-svg-icons";
import { faBookmark } from "@fortawesome/free-solid-svg-icons";


interface MetricCardProps {
  label: string;
  value?: number | string;
  unit?: string; //hours, mins
  metric?: 'totalHours' | 'totalGames' | 'unplayedGames';
  isSteamConnected?: boolean;
  isEpicConnected?: boolean;
}

export default function MetricCard({ label, value, unit, metric, isSteamConnected = false, isEpicConnected = false }: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState<number | string>(value || 0);

  useEffect(() => {
    const loadData = async () => {
      try {
        let steamGames = [];
        let epicGames = [];

        // Fetch Steam data if connected
        if (isSteamConnected) {
          const steamRes = await fetch('data/SteamData.json');
          if (steamRes.ok) {
            const steamData = await steamRes.json();
            steamGames = steamData.steam.games || [];
          }
        }

        // Fetch Epic data if connected
        if (isEpicConnected) {
          const epicRes = await fetch('data/EpicData.json');
          if (epicRes.ok) {
            const epicData = await epicRes.json();
            epicGames = epicData.epic.games || [];
          }
        }

        // Combine games from both platforms
        const allGames = [...steamGames, ...epicGames];

        switch (metric) {
          case 'totalHours': {
            const totalMinutes = allGames.reduce((sum: number, game: { playtime_forever: number }) => sum + game.playtime_forever, 0);
            setDisplayValue(parseFloat((totalMinutes / 60).toFixed(1)));
            break;
          }
          case 'totalGames': {
            setDisplayValue(allGames.length);
            break;
          }
          case 'unplayedGames': {
            const unplayed = allGames.filter((game: { playtime_forever: number }) => game.playtime_forever === 0).length;
            setDisplayValue(unplayed);
            break;
          }
        }
      } catch (err) {
        console.error("Failed to load JSON", err);
      }
    };

    loadData();
  }, [isSteamConnected, isEpicConnected, metric]);

  return (
    <>
      <div className="card outline outline-white/10 bg-(--background-color) rounded-sm px-3 py-2 flex items-center gap-4 border border-slate-700/40">
        <div className="flex items-center justify-end text-(--disabled-color) bg-linear-to-r from-(--background-color2) from-10% via-sky-800 via-50% to-(--background-color2) to-90% rounded-xl p-5 border-white/10 border">
          <FontAwesomeIcon 
            icon={
              metric === 'totalHours' ? faClock : 
              metric === 'totalGames' ? faGamepad : 
              metric === 'unplayedGames' ? faBookmark : 
              faGamepad
            }
            style={{ width: '50px', height: '40px' }}
          />
        </div>
        <div className="card-body">
            <p className="text-4xl font-bold pr-5 pt-3 pl-5" 
              style={{ color: 'var(--primary-color)' }}
            >
            {typeof displayValue === 'number' && metric === 'totalHours' 
              ? displayValue.toFixed(1) 
              : displayValue} {metric === 'totalGames' ? '' : unit}
            </p>
            <h2 className="card-title text-xl mt-2 pr-5 pb-3 pl-5">{label}</h2>
        </div>

      </div>
    </>
  );
}
