import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { validateSteamResponse, getSteamProfile } from "@/services/steamAuth";
import { supabase } from "@/services/supabaseClient";

export default function SettingsCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const handleSteamSync = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          const errorMsg = "Not authenticated. Please log in first.";
          setError(errorMsg);
          localStorage.setItem("steamSyncError", errorMsg);
          setTimeout(() => navigate("/"), 3000);
          return;
        }

        // Validate Steam OpenID response and extract Steam ID
        const steamId = await validateSteamResponse(searchParams);
        
        if (!steamId) {
          const errorMsg = "Invalid Steam response. Please try again.";
          setError(errorMsg);
          localStorage.setItem("steamSyncError", errorMsg);
          setTimeout(() => navigate("/settings"), 3000);
          return;
        }

        // Get Steam profile data
        const steamProfile = await getSteamProfile(steamId);
        
        if (!steamProfile) {
          const errorMsg = "Failed to fetch Steam profile. Please try again.";
          setError(errorMsg);
          localStorage.setItem("steamSyncError", errorMsg);
          setTimeout(() => navigate("/settings"), 3000);
          return;
        }

        // Check if this Steam account is already linked to a different user
        let existingProfile = null;
        try {
          const { data, error } = await supabase
            .from('steam_profiles')
            .select('id')
            .eq('steam_id', steamProfile.steamid)
            .limit(1);

          if (error && error.code !== 'PGRST116') {
            console.error('Error checking existing Steam profile:', error);
            throw new Error('Failed to verify Steam account availability');
          }

          // Check if profile exists and belongs to different user
          if (data && data.length > 0) {
            existingProfile = data[0];
          }
        } catch (queryError) {
          console.error('Database query error:', queryError);
          setError("An error occurred while checking Steam account. Please try again.");
          setTimeout(() => navigate("/settings"), 3000);
          return;
        }

        if (existingProfile && existingProfile.id !== user.id) {
          const errorMsg = "This Steam account is already connected to another AGGRO account. Please disconnect it from the other account first.";
          setError(errorMsg);
          localStorage.setItem("steamSyncError", errorMsg);
          setTimeout(() => navigate("/settings"), 3000);
          return;
        }

        // Update current user's metadata with Steam data
        const { error: metadataError } = await supabase.auth.updateUser({
          data: {
            steam_id: steamProfile.steamid,
            steam_username: steamProfile.personaname,
            avatar_url: steamProfile.avatarfull,
          },
        });

        if (metadataError) {
          throw new Error(`Failed to update user metadata: ${metadataError.message}`);
        }

        // Upsert steam_profiles record for current user
        const { error: profileError } = await supabase
          .from('steam_profiles')
          .upsert([
            {
              id: user.id,
              steam_id: steamProfile.steamid,
              steam_username: steamProfile.personaname,
              avatar_url: steamProfile.avatarfull,
            },
          ]);

        if (profileError) {
          throw new Error(`Failed to save Steam profile: ${profileError.message}`);
        }

        // Set Steam as connected in localStorage
        const syncedPlatforms = JSON.parse(localStorage.getItem("syncedPlatforms") || "{}");
        syncedPlatforms["Steam"] = true;
        localStorage.setItem("syncedPlatforms", JSON.stringify(syncedPlatforms));

        // Redirect to settings with success
        setTimeout(() => navigate("/settings?syncSuccess=steam"), 1500);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "An error occurred during Steam sync. Please try again.";
        console.error("Settings callback error:", err);
        setError(errorMsg);
        localStorage.setItem("steamSyncError", errorMsg);
        setTimeout(() => navigate("/settings"), 3000);
      }
    };

    handleSteamSync();
  }, [searchParams, navigate]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-(--main-background-color)">
      <div className="text-center">
        {error ? (
          <>
            <h2 className="text-2xl font-bold text-red-400 mb-3">
              {error}
            </h2>
            <p className="text-(--secondary-text-color)">
              Redirecting to settings...
            </p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-(--primary-color) mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-(--text-color)">
              Syncing Steam Account...
            </h2>
            <p className="text-(--secondary-text-color) mt-2">
              Please wait while we link your Steam account.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
