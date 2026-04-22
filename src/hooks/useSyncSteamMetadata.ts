import { useEffect } from "react";
import { supabase } from "@/services/supabaseClient";

/**
 * Custom hook that runs on app startup
 * Fetches user metadata and syncs Steam status to localStorage
 */
export function useSyncSteamMetadata() {
  useEffect(() => {
    const syncMetadata = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        // Check if user has steam_id in metadata
        const hasSteamId = !!user.user_metadata?.steam_id;

        // Get current syncedPlatforms from localStorage
        const saved = localStorage.getItem("syncedPlatforms");
        const syncedPlatforms = saved ? JSON.parse(saved) : {};

        // Update Steam status based on metadata
        if (hasSteamId) {
          syncedPlatforms["Steam"] = true;
        } else {
          syncedPlatforms["Steam"] = false;
        }

        // Preserve other platforms
        // (Epic Games or any future platforms)
        
        localStorage.setItem("syncedPlatforms", JSON.stringify(syncedPlatforms));
      } catch (error) {
        console.error("Error syncing Steam metadata:", error);
      }
    };

    syncMetadata();
  }, []);
}
