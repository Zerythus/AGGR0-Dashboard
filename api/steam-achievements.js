export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
      receivedMethod: req.method,
    });
  }

  try {
    const { steamId } = req.body;
    const { steamAppId } = req.query;

    if (!steamId) {
      return res.status(400).json({ error: "Steam ID is required" });
    }

    if (!steamAppId) {
      return res.status(400).json({ error: "Steam App ID is required" });
    }

    const STEAM_API_KEY = process.env.STEAM_API_KEY;

    if (!STEAM_API_KEY) {
      return res.status(500).json({ error: "STEAM_API_KEY not configured" });
    }

    const response = await fetch(
      `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${steamAppId}&key=${STEAM_API_KEY}&steamid=${steamId}`
    );

    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      return res.status(200).json({
        response: {
          unlocked: null,
          total: null,
          status: "none",
        },
      });
    }

    const playerstats = data?.playerstats;

    if (!playerstats) {
      return res.status(200).json({
        response: {
          unlocked: null,
          total: null,
          status: "none",
        },
      });
    }

    if (playerstats.success === false) {
      return res.status(200).json({
        response: {
          unlocked: null,
          total: null,
          status: "none",
        },
      });
    }

    const achievements = Array.isArray(playerstats.achievements)
      ? playerstats.achievements
      : [];

    if (achievements.length === 0) {
      return res.status(200).json({
        response: {
          unlocked: null,
          total: null,
          status: "none",
        },
      });
    }

    const unlockedCount = achievements.filter(
      (achievement) => achievement.achieved === 1
    ).length;

    const totalCount = achievements.length;

    return res.status(200).json({
      response: {
        unlocked: unlockedCount,
        total: totalCount,
        status: "ok",
      },
    });
  } catch (error) {
    console.error("Steam achievements fetch error:", error);

    return res.status(200).json({
      response: {
        unlocked: null,
        total: null,
        status: "none",
      },
    });
  }
}