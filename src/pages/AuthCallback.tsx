import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { validateSteamResponse, getSteamProfile, createOrUpdateSteamUser } from "@/services/steamAuth";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const handleSteamAuth = async () => {
      try {
        // Validate Steam OpenID response and extract Steam ID
        const steamId = await validateSteamResponse(searchParams);
        
        if (!steamId) {
          setError("Invalid Steam response. Please try logging in again.");
          setTimeout(() => navigate("/"), 3000);
          return;
        }

        // Get Steam profile data
        const steamProfile = await getSteamProfile(steamId);
        
        if (!steamProfile) {
          setError("Failed to fetch Steam profile. Please try again.");
          setTimeout(() => navigate("/"), 3000);
          return;
        }

        // Create or update user with Steam data
        const userId = await createOrUpdateSteamUser(steamProfile);
        
        if (!userId) {
          setError("Failed to create account. Please try again.");
          setTimeout(() => navigate("/"), 3000);
          return;
        }

        // Redirect to dashboard
        setTimeout(() => navigate("/dashboard"), 1000);
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("An error occurred during authentication. Please try again.");
        setTimeout(() => navigate("/"), 3000);
      }
    };

    handleSteamAuth();
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
              Redirecting to home...
            </p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-(--primary-color) mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-(--text-color)">
              Authenticating with Steam...
            </h2>
            <p className="text-(--secondary-text-color) mt-2">
              Please wait while we verify your Steam account.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
