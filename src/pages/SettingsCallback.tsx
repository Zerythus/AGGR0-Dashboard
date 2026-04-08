import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { validateSteamResponse, getSteamProfile, createOrUpdateSteamUser } from "@/services/steamAuth";
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
          setError("Not authenticated. Please log in first.");
          setTimeout(() => navigate("/"), 3000);
          return;
        }

        // Validate Steam OpenID response and extract Steam ID
        const steamId = await validateSteamResponse(searchParams);
        
        if (!steamId) {
          setError("Invalid Steam response. Please try again.");
          setTimeout(() => navigate("/settings"), 3000);
          return;
        }

        // Get Steam profile data
        const steamProfile = await getSteamProfile(steamId);
        
        if (!steamProfile) {
          setError("Failed to fetch Steam profile. Please try again.");
          setTimeout(() => navigate("/settings"), 3000);
          return;
        }

        // Check if this Steam account is already linked to a different user
        const { data: existingProfile } = await supabase
          .from('steam_profiles')
          .select('id')
          .eq('steam_id', steamProfile.steamid)
          .single();

        if (existingProfile && existingProfile.id !== user.id) {
          setError("This Steam account is already linked to another account. Disconnect it first.");
          setTimeout(() => navigate("/settings"), 3000);
          return;
        }

        // Update or create Steam profile for current user
        const userId = await createOrUpdateSteamUser(steamProfile);
        
        if (!userId) {
          setError("Failed to link Steam account. Please try again.");
          setTimeout(() => navigate("/settings"), 3000);
          return;
        }

        // Set Steam as connected in localStorage
        const syncedPlatforms = JSON.parse(localStorage.getItem("syncedPlatforms") || "{}");
        syncedPlatforms["Steam"] = true;
        localStorage.setItem("syncedPlatforms", JSON.stringify(syncedPlatforms));

        // Redirect to settings with success
        setTimeout(() => navigate("/settings?syncSuccess=steam"), 1500);
      } catch (err) {
        console.error("Settings callback error:", err);
        setError("An error occurred during Steam sync. Please try again.");
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
