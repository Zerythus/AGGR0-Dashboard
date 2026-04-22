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
      `https://store.steampowered.com/api/appdetails?appids=${steamAppId}&cc=CA&l=en&filters=price_overview`
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Failed to fetch price data from Steam",
      });
    }

    const data = await response.json();

    const appData = data[steamAppId];

    if (!appData || !appData.success) {
      return res.status(200).json({
        response: {
          price: null,
          currency: null,
        },
      });
    }

    const priceOverview = appData.data?.price_overview;

    if (!priceOverview) {
      return res.status(200).json({
        response: {
          price: null,
          currency: null,
        },
      });
    }

    return res.status(200).json({
      response: {
        price: priceOverview.final / 100, // Convert from cents to dollars
        currency: priceOverview.currency,
        formatted: priceOverview.initial_formatted,
      },
    });
  } catch (error) {
    console.error("Steam price fetch error:", error);

    return res.status(200).json({
      response: {
        price: null,
        currency: null,
        formatted: null,
      },
    });
  }
}
