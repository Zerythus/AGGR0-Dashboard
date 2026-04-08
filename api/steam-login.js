import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Steam-login: Supabase URL exists:', !!supabaseUrl);
console.log('Steam-login: Service role key exists:', !!supabaseServiceKey);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables in steam-login');
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { steamId } = req.body;

    if (!steamId) {
      return res.status(400).json({ error: 'Steam ID is required' });
    }

    // Check if user exists in steam_profiles
    const { data: steamProfile, error: queryError } = await supabase
      .from('steam_profiles')
      .select('id')
      .eq('steam_id', steamId)
      .single();

    if (queryError && queryError.code !== 'PGRST116') {
      console.error('Error querying steam_profiles:', queryError);
      return res.status(500).json({ error: 'Database error' });
    }

    // User exists, return user info for authentication
    if (steamProfile) {
      // Get full user details from auth
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(steamProfile.id);

      if (userError) {
        console.error('Error fetching user:', userError);
        return res.status(500).json({ error: 'Failed to fetch user', details: userError.message });
      }

      return res.status(200).json({
        success: true,
        userId: steamProfile.id,
        user: user,
      });
    }

    // User doesn't exist yet (new Steam user signup)
    return res.status(404).json({ 
      success: false, 
      message: 'User not found - please complete Steam signup first' 
    });

  } catch (error) {
    console.error('Steam login error:', error);
    return res.status(500).json({ error: error.message, success: false });
  }
}
