import { supabase } from "./supabaseClient";

export interface SteamProfileData {
  steam_id: string;
  steam_username: string;
  avatar_url: string;
}

/**
 * Fetch Steam profile data from the steam_profiles table
 * This is the single source of truth for Steam account information
 */
export async function getSteamProfileData(userId: string): Promise<SteamProfileData | null> {
  try {
    const { data, error } = await supabase
      .from('steam_profiles')
      .select('steam_id, steam_username, avatar_url')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found - user doesn't have Steam linked
        return null;
      }
      console.error('Error fetching Steam profile:', error);
      return null;
    }

    return data as SteamProfileData;
  } catch (error) {
    console.error('Failed to fetch Steam profile data:', error);
    return null;
  }
}
