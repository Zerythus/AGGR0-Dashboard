export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { steamId } = req.body;

    if (!steamId) {
      return res.status(400).json({ error: 'Steam ID is required' });
    }

    const STEAM_API_KEY = process.env.STEAM_API_KEY;

    if (!STEAM_API_KEY) {
      return res.status(500).json({ error: 'STEAM_API_KEY not configured' });
    }

    const response = await fetch(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true`
    );

    if (!response.ok) {
      console.error(`Steam API returned status ${response.status}`);
      return res.status(502).json({ error: `Steam API error: ${response.status}` });
    }

    const data = await response.json();

    if (!data.response) {
      console.error('Invalid Steam API response structure:', data);
      return res.status(502).json({ error: 'Invalid Steam API response' });
    }

    // Check if profile is private (games list is null and game_count is 0 or undefined)
    if (!data.response.games && (!data.response.game_count || data.response.game_count === 0)) {
      return res.status(403).json({
        error: "This user's Steam profile is private",
        details: 'The user must set their game library to public in Steam privacy settings',
        isPrivateProfile: true
      });
    }

    // Transform Steam API format to match your expected game format
    const games = (data.response.games || []).map((game) => ({
      appid: game.appid,
      name: game.name,
      playtime_forever: game.playtime_forever || 0,
      rtime_last_played: game.rtime_last_played || 0,
      img_icon_url: game.img_icon_url || '',
    }));

    return res.status(200).json({ response: { games } });
  } catch (error) {
    console.error('Steam owned games fetch error:', error);
    return res.status(500).json({ error: error.message });
  }
}
