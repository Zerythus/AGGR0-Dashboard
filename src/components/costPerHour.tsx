import { useEffect, useMemo, useRef, useState } from "react";

import { faPencil } from "@fortawesome/free-solid-svg-icons/faPencil";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import SearchFilter from "./searchFilter";

type GameItem = {
  appid: number | string;
  name: string;
  playtime_forever?: number; // in minutes from Steam JSON
  hours?: number; // optional direct hours field
  header_image?: string;
  image?: string;
  img_icon_url?: string;
  platform?: "steam" | "epic";
  image_url?: string;
};

function minToHours(minutes: number): number {
    return Math.round((minutes / 60) * 10) / 10; // Round to 1 decimal place
}

function getGameImage(game: GameItem): string {
    if (game.platform === "epic") {
        return game.image_url || "https://placeholdit.com/800x600/1f2c44/cdcdcd?text=Game+Image&font=&font_size=80";
    }
    return `https://cdn.akamai.steamstatic.com/steam/apps/${Number(game.appid)}/header.jpg`;
}

function getGameIconUrl(game: GameItem): string {
    if (game.platform === "epic") {
        return "/icons/epic-games.svg";
    }
    return `https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/${Number(game.appid)}/${game.img_icon_url || ""}.jpg`;
}

interface CostPerHourProps {
  isSteamConnected: boolean;
  isEpicConnected: boolean;
}

export default function CostPerHour({ isSteamConnected, isEpicConnected }: CostPerHourProps) {
  const [games, setGames] = useState<GameItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGame, setSelectedGame] = useState<GameItem | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [pricePaid, setPricePaid] = useState("0.00");
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [isFree, setIsFree] = useState(false);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Fetch games from SteamData.json and/or EpicData.json
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const allGames: GameItem[] = [];

        if (isSteamConnected) {
          const steamResponse = await fetch("/data/SteamData.json");
          const steamData = await steamResponse.json();
          const steamGames = (steamData.steam?.games || []).map((game: GameItem) => ({
            ...game,
            platform: "steam"
          }));
          allGames.push(...steamGames);
        }

        if (isEpicConnected) {
          const epicResponse = await fetch("/data/EpicData.json");
          const epicData = await epicResponse.json();
          const epicGames = (epicData.epic?.games || []).map((game: GameItem) => ({
            ...game,
            platform: "epic"
          }));
          allGames.push(...epicGames);
        }

        setGames(allGames);
      } catch (error) {
        console.error("Error fetching games:", error);
      }
    };
    fetchGames();
  }, [isSteamConnected, isEpicConnected]);

  const filteredGames = useMemo(() => {
    if (!searchTerm.trim()) return games.slice(0, 50);

    return games
      .filter((game) =>
        game.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 50);
  }, [games, searchTerm]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function getHours(game: GameItem | null) {
    if (!game) return 0;
    if (typeof game.hours === "number") return game.hours;
    if (typeof game.playtime_forever === "number") {
      return minToHours(game.playtime_forever);
    }
    return 0;
  }

  function handleSelectGame(game: GameItem) {
    setSelectedGame(game);
    setSearchTerm(game.name);
    setIsDropdownOpen(false);
  }

  function handleClearSearch() {
    setSearchTerm("");
    setSelectedGame(null);
    setIsDropdownOpen(false);
    setIsEditingPrice(false);
    setIsFree(false);
    setPricePaid("0.00");
  }

  function handleGiftToggle() {
    setIsFree((prev) => !prev);
    setIsEditingPrice(false);
  }

  const hours = getHours(selectedGame);
  const numericPrice = isFree ? 0 : Number(pricePaid || 0);

  const imageSrc =
    selectedGame
      ? getGameImage(selectedGame)
      : "https://placeholdit.com/800x600/1f2c44/cdcdcd?text=Game+Image&font=&font_size=80";

  return (
    <section className="w-full max-w-full rounded-sm bg-(--background-color) outline outline-white/10 p-5">

    <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-semibold text-(--disabled-color)">Cost per hour</h3>  
    </div>
    <p className='text-base text-(--secondary-text-color)'>
      Cost per hour calculates how much money you've spent for each hour of gameplay on a specific game.
    </p>

      <div ref={wrapperRef} className="relative mb-6">
        <SearchFilter 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm}
          onFocus={() => setIsDropdownOpen(true)}
          onChange={() => {
            setSelectedGame(null);
            setIsDropdownOpen(true);
          }}
          onClear={handleClearSearch}
        />

        {isDropdownOpen && (
          <div className="absolute left-0 right-0 z-20 max-h-72 overflow-y-auto rounded-sm border border-slate-300 bg-white shadow-lg">
            {filteredGames.length > 0 ? (
              filteredGames.map((game) => (
                <button
                  key={game.appid}
                  type="button"
                  onClick={() => handleSelectGame(game)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-100"
                >
                  <div className="h-6 w-6 overflow-hidden rounded-sm bg-slate-200">
                    <img
                      src={getGameIconUrl(game)}
                      alt={game.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="font-medium text-slate-900">
                    {game.name}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-4 py-4 text-lg text-slate-500">
                No games found
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-sm bg-(--background-inner-color) p-5 text-white">
        <div className="mb-5 overflow-hidden rounded-sm bg-slate-800">
          <img
            src={imageSrc}
            alt={selectedGame?.name || "Selected game"}
            className="h-48 w-full object-cover"
          />
        </div>

        <h3 className="mb-3 text-2xl font-bold tracking-tight text-slate-50">
          {selectedGame?.name || "Game Title"}
        </h3>

        <div className="mb-3 flex items-center justify-between gap-4">
          <span className="text-xl text-white">Your hours</span>
          <span className="text-xl text-white">
            {selectedGame ? `${hours} hours` : "--"}
          </span>
        </div>

        <div className="mb-3 flex items-center justify-between gap-4">
          <span className="text-xl text-slate-200">Price paid (CAD)</span>

          <div
            className={`flex items-center gap-1 ${
              isFree ? "opacity-50" : "opacity-100"
            }`}
          >
            <input
              ref={inputRef}
              type="number"
              step="0.01"
              min="0"
              max="99999"
              value={isFree ? "0.00" : pricePaid}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || Number(value) <= 99999) {
                  setPricePaid(value);
                }
              }}
              disabled={!isEditingPrice || isFree}
              className="w-25 rounded-sm border border-slate-300 bg-white px-2 py-2 text-right text-xl text-slate-900 outline-none disabled:cursor-not-allowed"
            />

            <button
              type="button"
              disabled={isFree}
              onClick={() => {
                setIsEditingPrice((prev) => !prev);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
              className="rounded-sm bg-sky-500 p-3 text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-500"
              aria-label="Edit price"
            >
              <FontAwesomeIcon icon={faPencil} className="h-6 w-6" strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <div className="flex items-center">
          <label className="cursor-pointer flex items-center">
            <input
              type="checkbox"
              checked={isFree}
              onChange={handleGiftToggle}
              className="h-5 w-5 rounded-sm border-slate-300 accent-sky-500"
            />
          </label>

          <span className="text-xl text-slate-100 ml-3">
            Received as a gift / free
          </span>
        </div>

        <div className="text-center mt-5">
          {isFree ? (
            <p className="text-3xl font-medium tracking-tight text-sky-400">
              FREE
            </p>
          ) : (
            <p className="text-3xl font-medium tracking-tight text-slate-50">
              <span className="text-sky-400">
                {selectedGame && hours > 0 && !Number.isNaN(numericPrice)
                  ? `$${(numericPrice / hours).toFixed(2)}`
                  : selectedGame && hours <= 0
                  ? "No playtime yet"
                  : "$0.00"}
              </span>
              {selectedGame && hours > 0 && !Number.isNaN(numericPrice) && (
                <span className="text-slate-100"> CAD / hour</span>
              )}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}