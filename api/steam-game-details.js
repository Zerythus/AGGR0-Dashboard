export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
      receivedMethod: req.method,
    });
  }

  try {
    const { steamAppId } = req.body;

    if (!steamAppId) {
      return res.status(400).json({ error: "Steam App ID is required" });
    }

    const response = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${steamAppId}&cc=CA&l=en`
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Failed to fetch game details from Steam",
      });
    }

    const data = await response.json();
    const appData = data[steamAppId];

    if (!appData || !appData.success) {
      return res.status(200).json({
        response: {
          developer: null,
          genres: [],
          metacritic: null,
          esrb: null,
          pegi: null,
        },
      });
    }

    const gameData = appData.data;

    // Extract developer(s)
    const developers = gameData.developers || [];
    const developer = developers.length > 0 ? developers[0] : null;

    // Extract genres
    const genres = (gameData.genres || []).map(g => g.description);

    // Extract Metacritic score
    const metacritic = gameData.metacritic?.score || null;

    // Extract ESRB rating
    const esrb = gameData.ratings?.esrb?.rating || null;

    // Extract PEGI rating
    const pegi = gameData.ratings?.pegi?.rating || null;

    return res.status(200).json({
      response: {
        developer,
        genres,
        metacritic,
        esrb,
        pegi,
      },
    });
  } catch (error) {
    console.error("Steam game details fetch error:", error);

    return res.status(200).json({
      response: {
        developer: null,
        genres: [],
        metacritic: null,
        esrb: null,
        pegi: null,
      },
    });
  }
}
