import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faGamepad } from "@fortawesome/free-solid-svg-icons";
// import { faClock } from "@fortawesome/free-solid-svg-icons";
// import { faBookmark } from "@fortawesome/free-solid-svg-icons";


interface MetricCardProps {
  label: string;
  value?: number | string;
  unit?: string; //hours, mins
  metric?: 'totalHours' | 'totalGames' | 'unplayedGames' | 'unplayedGamesPrice';
  subtitle?: string;
  isSteamConnected?: boolean;
  isEpicConnected?: boolean;
}

export default function MetricCard({ label, value, unit, metric, subtitle, isSteamConnected = false, isEpicConnected = false }: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState<number | string>(value || 0);
  const [loading, setLoading] = useState(true);
  const [steamId, setSteamId] = useState<string | null>(null);
  const [maxUnplayedValue, setMaxUnplayedValue] = useState<number>(500);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentSteamId = async () => {
      if (!isSteamConnected) {
        setSteamId(null);
        setLoading(false);
        return;
      }

      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("Failed to get user:", userError);
          setSteamId(null);
          setLoading(false);
          return;
        }

        setUserId(user.id);
        const steam_id = user.user_metadata?.steam_id;
        setSteamId(steam_id ?? null);
      } catch (error) {
        console.error("Error fetching user:", error);
        setSteamId(null);
      }
    };

    getCurrentSteamId();
  }, [isSteamConnected]);

  // Fetch max unplayed value from user_settings
  useEffect(() => {
    const fetchMaxUnplayedValue = async () => {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('max_unplayed_value')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user settings:', error);
          return;
        }

        if (data) {
          setMaxUnplayedValue(data.max_unplayed_value || 500);
        }
      } catch (error) {
        console.error('Error fetching max unplayed value:', error);
      }
    };

    fetchMaxUnplayedValue();
  }, [userId]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        let steamGames = [];
        let epicGames = [];

        // Fetch Steam data if connected and has steamId
        if (isSteamConnected && steamId) {
          try {
            const steamRes = await fetch('/api/steam-owned-games', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ steamId }),
            });

            if (steamRes.ok) {
              const steamData = await steamRes.json();
              steamGames = steamData.response?.games || [];
            } else {
              console.error('Failed to fetch Steam games:', steamRes.statusText);
            }
          } catch (error) {
            console.error('Error fetching Steam games:', error);
          }
        }

        // Fetch Epic data if connected
        if (isEpicConnected) {
          try {
            const epicRes = await fetch('data/EpicData.json');
            if (epicRes.ok) {
              const epicData = await epicRes.json();
              epicGames = epicData.epic?.games || [];
            }
          } catch (error) {
            console.error('Error fetching Epic games:', error);
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
          case 'unplayedGamesPrice': {
            const unplayedGames = allGames.filter((game: { playtime_forever: number }) => game.playtime_forever === 0);
            
            // Only fetch prices for Steam unplayed games
            const steamUnplayed = unplayedGames.filter((game: { playtime_forever: number; platform?: string }) => !game.platform || game.platform === 'steam');

            if (steamUnplayed.length === 0) {
              setDisplayValue(0);
            } else {
              try {
                const pricePromises = steamUnplayed.map((game: { appid: number }) =>
                  fetch('/api/steam-price', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ steamAppId: game.appid }),
                  })
                    .then((res) => res.json())
                    .then((data) => data.response?.price || 0)
                    .catch(() => 0)
                );

                const prices = await Promise.all(pricePromises);
                const totalPrice = prices.reduce((sum: number, price: number) => sum + price, 0);
                setDisplayValue(parseFloat(totalPrice.toFixed(2)));
              } catch (error) {
                console.error('Error fetching prices:', error);
                setDisplayValue(0);
              }
            }
            break;
          }
        }
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isSteamConnected, isEpicConnected, metric, steamId, maxUnplayedValue]);

  // Subscribe to user_settings changes
  useEffect(() => {
    if (!userId) return;

    const subscription = supabase
      .channel('user_settings')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_settings',
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: { max_unplayed_value: number } }) => {
          setMaxUnplayedValue(payload.new.max_unplayed_value || 500);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  // Check if unplayed games price exceeds max threshold
  const isUnplayedValueExceeded = 
    metric === 'unplayedGamesPrice' && 
    typeof displayValue === 'number' && 
    displayValue >= maxUnplayedValue;

  return (
    <>
      <div className="card outline outline-white/10 bg-(--background-color) rounded-sm px-3 py-2 flex items-center justify-center border border-slate-700/40">
        <div className="card-body text-center">
            <p className="text-4xl font-bold px-5 py-3" 
              style={{ color: isUnplayedValueExceeded ? '#FFD700' : 'var(--primary-color)' }}
            >
            {loading ? '...' : (
              <>
                {metric === 'unplayedGamesPrice'
                  ? `$${displayValue}`
                  : typeof displayValue === 'number' && metric === 'totalHours' 
                  ? displayValue.toFixed(1) 
                  : displayValue}
              </>
            )} {metric === 'totalGames' || metric === 'unplayedGamesPrice' ? '' : unit}
            </p>
            <h2 className="card-title text-lg mt-2 px-5 pb-1">{label}</h2>
            {subtitle && <p className="text-xs text-(--secondary-text-color) px-5 pb-3">{subtitle}</p>}
        </div>

      </div>
    </>
  );
}
