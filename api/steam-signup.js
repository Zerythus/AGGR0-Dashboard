import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Steam-signup: Supabase URL exists:', !!supabaseUrl);
console.log('Steam-signup: Service role key exists:', !!supabaseServiceKey);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables in steam-signup');
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { steamId, email, password, steamUsername, avatarUrl } = req.body;

    if (!steamId || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create auth user with admin API
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username: steamUsername,
        steam_username: steamUsername,
        steam_id: steamId,
        avatar_url: avatarUrl,
      },
    });

    if (userError) {
      console.error('Error creating auth user:', userError);
      return res.status(500).json({ error: 'Failed to create user', details: userError.message });
    }

    if (!userData.user) {
      return res.status(500).json({ error: 'Failed to create user - no user returned' });
    }

    // Insert into steam_profiles table
    const { error: profileError } = await supabase
      .from('steam_profiles')
      .insert([
        {
          id: userData.user.id,
          steam_id: steamId,
          steam_username: steamUsername,
          avatar_url: avatarUrl,
        },
      ]);

    if (profileError) {
      console.error('Error saving to steam_profiles:', profileError);
      // Don't fail the request, auth user was created successfully
    }

    return res.status(200).json({
      success: true,
      userId: userData.user.id,
      user: userData.user,
    });

  } catch (error) {
    console.error('Steam signup error:', error);
    return res.status(500).json({ error: error.message, success: false });
  }
}
