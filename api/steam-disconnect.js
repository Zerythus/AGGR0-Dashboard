import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Delete user_monitor_games records for this user's Steam games
    // (Since we're removing Steam data completely)
    const { error: deleteGamesError } = await supabase
      .from('user_monitor_games')
      .delete()
      .eq('user_id', userId);

    if (deleteGamesError && deleteGamesError.code !== 'PGRST116') {
      console.error('Error deleting monitored games:', deleteGamesError);
      return res.status(500).json({ error: 'Failed to delete monitored games' });
    }

    // Delete steam_profiles record
    const { error: deleteProfileError } = await supabase
      .from('steam_profiles')
      .delete()
      .eq('id', userId);

    if (deleteProfileError && deleteProfileError.code !== 'PGRST116') {
      console.error('Error deleting Steam profile:', deleteProfileError);
      return res.status(500).json({ error: 'Failed to delete Steam profile' });
    }

    // Clear Steam metadata from auth user
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          steam_id: null,
          steam_username: null,
          avatar_url: null,
          use_steam_username: false,
        },
      }
    );

    if (updateError) {
      console.error('Error clearing Steam metadata:', updateError);
      return res.status(500).json({ error: 'Failed to clear Steam data', details: updateError.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Steam account disconnected successfully',
    });

  } catch (error) {
    console.error('Steam disconnect error:', error);
    return res.status(500).json({ error: error.message });
  }
}
