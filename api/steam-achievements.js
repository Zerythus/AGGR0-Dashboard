export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
      receivedMethod: req.method,
    });
  }

  try {
    // const { steamId } = req.body;
    // const { steamAppId } = req.query;
    const { steamId, steamAppId } = req.body;

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

    const schemaResponse = await fetch(
      `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v0002/?appid=${steamAppId}&key=${STEAM_API_KEY}&steamid=${steamId}`
    );

    const rawText = await response.text();
    const schemaRawText = await schemaResponse.text();

    let data;
    let schemaData;
    try {
      data = JSON.parse(rawText);
      schemaData = JSON.parse(schemaRawText);
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

    const schemaAchievements = Array.isArray(schemaData?.game?.availableGameStats?.achievements)
      ? schemaData.game.availableGameStats.achievements
      : [];

    // Create a map of schema achievements by apiname for quick lookup
    const schemaMap = {};
    schemaAchievements.forEach((achievement) => {
      schemaMap[achievement.name] = achievement;
    });

    if (achievements.length === 0) {
      return res.status(200).json({
        response: {
          unlocked: null,
          total: null,
          status: "none",
          achievements: [],
        },
      });
    }

    const unlockedCount = achievements.filter(
      (achievement) => achievement.achieved === 1
    ).length;

    const totalCount = achievements.length;

    const achievementsList = achievements.map((achievement) => {
      const schemaAchievement = schemaMap[achievement.apiname] || {};
      return {
        apiname: achievement.apiname,
        name: schemaAchievement.displayName || achievement.apiname,
        description: schemaAchievement.description || "",
        icon: schemaAchievement.icon || "",
        icongray: schemaAchievement.icongray || "",
        achieved: achievement.achieved === 1,
        unlocktime: achievement.unlocktime || 0,
      };
    });

    return res.status(200).json({
      response: {
        unlocked: unlockedCount,
        total: totalCount,
        status: "ok",
        achievements: achievementsList,
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