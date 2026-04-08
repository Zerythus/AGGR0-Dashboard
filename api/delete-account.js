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

    console.log(`Attempting to delete account for user: ${userId}`);

    // Delete all user data from tables (in order of dependencies)
    
    // 1. Delete user_monitor_games records
    const { error: deleteGamesError } = await supabase
      .from('user_monitor_games')
      .delete()
      .eq('user_id', userId);

    if (deleteGamesError && deleteGamesError.code !== 'PGRST116') {
      console.error('Error deleting monitored games:', deleteGamesError);
      return res.status(500).json({ error: 'Failed to delete user data' });
    }

    // 2. Delete steam_profiles record
    const { error: deleteSteamProfileError } = await supabase
      .from('steam_profiles')
      .delete()
      .eq('id', userId);

    if (deleteSteamProfileError && deleteSteamProfileError.code !== 'PGRST116') {
      console.error('Error deleting Steam profile:', deleteSteamProfileError);
      return res.status(500).json({ error: 'Failed to delete Steam profile' });
    }

    // 3. Try to delete from profiles table if it exists
    const { error: deleteProfilesError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (deleteProfilesError && deleteProfilesError.code !== 'PGRST116' && deleteProfilesError.code !== 'PGRST204') {
      console.error('Warning: Error deleting from profiles table:', deleteProfilesError);
      // Don't fail on this, continue with auth deletion
    }

    // 4. DELETE THE AUTH USER FROM SUPABASE - This is the critical step
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError);
      return res.status(500).json({ 
        error: 'Failed to delete account from authentication system',
        details: deleteUserError.message 
      });
    }

    console.log(`Account successfully deleted for user: ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'Account and all associated data deleted permanently',
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    return res.status(500).json({ error: error.message });
  }
}
