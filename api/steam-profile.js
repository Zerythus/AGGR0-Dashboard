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
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`
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

    if (data.response?.players?.[0]) {
      const player = data.response.players[0];
      
      // Check if profile is private (communityvisibilitystate: 1 means private, 3 means public)
      if (player.communityvisibilitystate === 1) {
        return res.status(403).json({
          error: "This user's Steam profile is private",
          details: 'The user must set their profile to public in Steam privacy settings',
          isPrivateProfile: true
        });
      }
      
      return res.status(200).json(player);
    }

    return res.status(404).json({ error: 'Steam profile not found' });
  } catch (error) {
    console.error('Steam profile fetch error:', error);
    return res.status(500).json({ error: error.message });
  }
}
