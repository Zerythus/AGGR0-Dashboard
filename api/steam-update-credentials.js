import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Steam-update-credentials: Supabase URL exists:', !!supabaseUrl);
console.log('Steam-update-credentials: Service role key exists:', !!supabaseServiceKey);

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', success: false });
  }

  try {
    const { steamId, password, email } = req.body;

    console.log('Request received - steamId:', steamId);
    console.log('Environment check - URL:', supabaseUrl ? 'SET' : 'NOT SET');
    console.log('Environment check - Key:', supabaseServiceKey ? 'SET' : 'NOT SET');

    if (!steamId || !password || !email) {
      return res.status(400).json({ error: 'Missing required fields', success: false });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Supabase environment variables not set',
        success: false 
      });
    }

    // Find user by Steam ID
    const { data: steamProfile, error: queryError } = await supabase
      .from('steam_profiles')
      .select('id')
      .eq('steam_id', steamId)
      .single();

    if (queryError && queryError.code !== 'PGRST116') {
      console.error('Error finding user:', queryError);
      return res.status(500).json({ error: 'Database query error', success: false });
    }

    if (!steamProfile) {
      return res.status(404).json({ error: 'User not found', success: false });
    }

    // Update user password and ensure email is confirmed
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      steamProfile.id,
      {
        password,
        email_confirm: true,
      }
    );

    if (updateError) {
      console.error('Error updating user:', updateError);
      return res.status(500).json({ error: 'Failed to update credentials', details: updateError.message, success: false });
    }

    console.log('Successfully updated credentials for Steam user:', steamId);

    return res.status(200).json({
      success: true,
      message: 'User credentials updated',
      userId: steamProfile.id,
    });

  } catch (error) {
    console.error('Update credentials error:', error);
    return res.status(500).json({ error: error.message, success: false });
  }
}
