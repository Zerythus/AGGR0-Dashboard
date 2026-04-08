export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate required OpenID params
    const requiredParams = [
      'openid.ns',
      'openid.identity',
      'openid.claimed_id',
      'openid.mode',
      'openid.signed'
    ];

    const hasAllParams = requiredParams.every(param => req.body[param]);

    if (!hasAllParams) {
      console.log('Missing required OpenID params');
      return res.status(400).json({ valid: false });
    }

    // Extract and validate Steam ID format
    const claimedId = req.body['openid.claimed_id'];
    if (!claimedId || !claimedId.includes('/openid/id/')) {
      console.log('Invalid claimed_id format:', claimedId);
      return res.status(400).json({ valid: false });
    }

    const steamId = claimedId.split('/').pop();
    if (!steamId || isNaN(steamId)) {
      console.log('Invalid Steam ID:', steamId);
      return res.status(400).json({ valid: false });
    }

    console.log('Valid Steam response with ID:', steamId);
    res.status(200).json({ valid: true, steamId });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: error.message });
  }
}
