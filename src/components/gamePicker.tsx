// Steam achievements are edited into the JSON file directly (they do not depict real count of achievements)

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../services/supabaseClient";
import SearchFilter from "./searchFilter";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleMinus } from "@fortawesome/free-solid-svg-icons/faCircleMinus";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons/faRectangleXmark";

type Platform = "steam" | "epic";

type Game = {
  appid: number;
  name: string;
  playtime_forever: number;
  rtime_last_played: number;
  img_icon_url: string;
  total_achievements?: number;
  unlocked_achievements?: number;
  platform?: Platform;
  image_url?: string;
};

type MonitorRow = {
  app_id: number;
  platform: Platform;
  slot_index: number;
};

function minToHours(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}

function epochToDate(epoch: number): string {
  if (epoch === 0) return "Never Played";
  return new Date(epoch * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function getGameIconUrl(
  appid: number,
  img_icon_url: string,
  platform?: Platform
) {
  if (platform === "epic") return "/icons/epic-games.svg";
  return `https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/${appid}/${img_icon_url}.jpg`;
}

function getGameHeaderUrl(game: Game) {
  if (game.platform === "epic" && game.image_url) return game.image_url;
  return `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg`;
}

interface Props {
  isSteamConnected: boolean;
  isEpicConnected: boolean;
}

export default function GamePicker({
  isSteamConnected,
  isEpicConnected,
}: Props) {
  const [games, setGames] = useState<Game[]>([]);
  const [slots, setSlots] = useState<(Game | null)[]>([null, null, null]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement | null>(null);

  const gameKey = (id: number, p?: Platform) => `${p}-${id}`;

  const gameMap = useMemo(() => {
    return new Map(
      games.map((g) => [gameKey(g.appid, g.platform), g])
    );
  }, [games]);

  const filteredGames = games.filter((g) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // get user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // fetch games
  useEffect(() => {
    const load = async () => {
      const all: Game[] = [];

      if (isSteamConnected) {
        const res = await fetch("/data/SteamData.json");
        const json = await res.json();
        all.push(
          ...json.steam.games.map((g: Game) => ({
            ...g,
            platform: "steam",
          }))
        );
      }

      if (isEpicConnected) {
        const res = await fetch("/data/EpicData.json");
        const json = await res.json();
        all.push(
          ...json.epic.games.map((g: Game) => ({
            ...g,
            platform: "epic",
          }))
        );
      }

      setGames(all);
    };

    load();
  }, [isSteamConnected, isEpicConnected]);

  // fetch selected
  useEffect(() => {
    if (!userId) return;

    async function fetchSelected() {
      const { data } = await supabase
        .from("user_monitor_games")
        .select("app_id, platform, slot_index")
        .eq("user_id", userId);

      const next: (Game | null)[] = [null, null, null];

      (data as MonitorRow[])?.forEach((row) => {
        const game = gameMap.get(gameKey(row.app_id, row.platform)) || null;
        if (row.slot_index >= 0 && row.slot_index <= 2) {
          next[row.slot_index] = game;
        }
      });

      setSlots(next);
    }

    fetchSelected();
  }, [userId, gameMap]);

  // modal close
  useEffect(() => {
    if (!pickerOpen) return;

    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPickerOpen(false);
    };

    const click = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };

    document.addEventListener("keydown", esc);
    document.addEventListener("mousedown", click);

    return () => {
      document.removeEventListener("keydown", esc);
      document.removeEventListener("mousedown", click);
    };
  }, [pickerOpen]);

  function open(slot: number) {
    setActiveSlot(slot);
    setPickerOpen(true);
  }

  async function save(game: Game, slot: number) {
    if (!userId || !game.platform) return;

    // clear slot
    await supabase
      .from("user_monitor_games")
      .delete()
      .eq("user_id", userId)
      .eq("platform", game.platform)
      .eq("slot_index", slot);

    // remove duplicate game
    await supabase
      .from("user_monitor_games")
      .delete()
      .eq("user_id", userId)
      .eq("platform", game.platform)
      .eq("app_id", game.appid);

    await supabase.from("user_monitor_games").insert({
      user_id: userId,
      app_id: game.appid,
      platform: game.platform,
      slot_index: slot,
    });
  }

  async function remove(game: Game, slot: number) {
    if (!userId || !game.platform) return;

    await supabase
      .from("user_monitor_games")
      .delete()
      .eq("user_id", userId)
      .eq("platform", game.platform)
      .eq("app_id", game.appid)
      .eq("slot_index", slot);
  }

  async function select(game: Game) {
    if (activeSlot === null) return;

    const next = [...slots];
    next[activeSlot] = game;
    setSlots(next);
    setPickerOpen(false);

    await save(game, activeSlot);
  }

  async function clear(i: number) {
    const game = slots[i];
    const next = [...slots];
    next[i] = null;
    setSlots(next);

    if (game) await remove(game, i);
  }

  return (
    <div className="mt-5 bg-(--background-color) p-5 rounded-sm outline outline-white/10 w-full">
      <h3 className="text-2xl mb-2">Monitor up to three games</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
        {slots.map((g, i) => (
          <div key={i}>
            {g ? (
              <div>
                <div className="relative">
                  <motion.img
                    src={getGameHeaderUrl(g)}
                    className="w-full h-40 object-cover"
                  />
                  <FontAwesomeIcon
                    icon={faCircleMinus}
                    className="absolute top-2 right-2 cursor-pointer"
                    onClick={() => clear(i)}
                  />
                </div>

                <div className="p-3">
                  <p>{g.name}</p>
                  <p>{minToHours(g.playtime_forever)} hrs</p>
                  <p>{epochToDate(g.rtime_last_played)}</p>
                  <p>{g.platform}</p>
                </div>
              </div>
            ) : (
              <button onClick={() => open(i)}>+ Add Game</button>
            )}
          </div>
        ))}
      </div>

      {pickerOpen && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center">
          <div ref={modalRef} className="bg-black p-4 w-full max-w-xl">
            <SearchFilter
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onClear={() => setSearchTerm("")}
            />

            <FontAwesomeIcon
              icon={faRectangleXmark}
              onClick={() => setPickerOpen(false)}
            />

            <ul>
              {filteredGames.map((g) => (
                <li key={gameKey(g.appid, g.platform)}>
                  <button onClick={() => select(g)}>
                    <img
                      src={getGameIconUrl(
                        g.appid,
                        g.img_icon_url,
                        g.platform
                      )}
                      className="w-5 inline"
                    />
                    {g.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}