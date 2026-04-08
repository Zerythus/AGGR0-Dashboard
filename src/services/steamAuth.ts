import { supabase } from "./supabaseClient";

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
// const STEAM_API_KEY = import.meta.env.VITE_STEAM_API_KEY;
const APP_URL = window.location.origin;

interface SteamUser {
  steamid: string;
  communityvisibilitystate: number;
  profilestate: number;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  personastate: number;
  realname?: string;
  primaryclanid?: string;
  timecreated?: number;
  loccountrycode?: string;
}

export function getSteamLoginUrl(): string {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.mode": "checkid_setup",
    "openid.return_to": `${APP_URL}/auth-callback`,
    "openid.realm": APP_URL,
  });

  return `${STEAM_OPENID_URL}?${params.toString()}`;
}

export async function validateSteamResponse(
  params: URLSearchParams
): Promise<string | null> {
  try {
    // Check if Steam returned an error
    if (params.get("openid.mode") !== "id_res") {
      console.error("Invalid OpenID mode from Steam");
      return null;
    }

    // Convert URLSearchParams to object for API
    const paramsObj: Record<string, string> = {};
    params.forEach((value, key) => {
      paramsObj[key] = value;
    });

    // Call Vercel API function
    const response = await fetch("/api/steam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paramsObj),
    });

    const data = await response.json();

    if (!data.valid) {
      console.error("Steam verification failed");
      return null;
    }

    // Extract Steam ID from claimed_id URL (format: https://steamcommunity.com/openid/id/[STEAMID])
    const claimedId = params.get("openid.claimed_id");
    if (!claimedId) {
      console.error("No claimed_id found in Steam response");
      return null;
    }

    const steamId = claimedId.split("/").pop();

    if (!steamId) {
      console.error("Could not extract Steam ID from claimed_id");
      return null;
    }

    return steamId;
  } catch (error) {
    console.error("Steam validation error:", error);
    return null;
  }
}

export async function getSteamProfile(steamId: string): Promise<SteamUser | null> {
  try {
    const response = await fetch("/api/steam-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steamId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      console.error("Failed to fetch Steam profile:", response.status, errorData);
      return null;
    }

    const data = await response.json();
    return data || null;
  } catch (error) {
    console.error("Failed to fetch Steam profile:", error);
    return null;
  }
}

export async function createOrUpdateSteamUser(
  steamUser: SteamUser,
  email?: string
): Promise<string | null> {
  try {
    const userEmail = email || `steam_${steamUser.steamid}@steam.local`;
    // Use deterministic password based on Steam ID for consistent authentication
    const userPassword = `steam_${steamUser.steamid}_auth`;

    // Check if user with this Steam ID already exists
    const { data: existingUser, error: queryError } = await supabase
      .from("steam_profiles")
      .select("id")
      .eq("steam_id", steamUser.steamid)
      .single();

    if (queryError && queryError.code !== "PGRST116") {
      // PGRST116 means no rows found, which is expected for new users
      console.error("Error querying existing user:", queryError);
      return null;
    }

    // If user exists, sign them in directly (we already know they exist in steam_profiles)
    if (existingUser) {
      console.log("User already exists, ensuring credentials are set up");
      
      // First, ensure the user's credentials are properly set up in Supabase
      try {
        const credResponse = await fetch("/api/steam-update-credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            steamId: steamUser.steamid,
            email: userEmail,
            password: userPassword,
          }),
        });

        if (!credResponse.ok) {
          const credData = await credResponse.json();
          console.error("Failed to update credentials:", credData.error);
          // Continue anyway, maybe they were already set up
        }
      } catch (credError) {
        console.error("Error updating credentials:", credError);
        // Continue anyway
      }

      // Now try to sign in with the credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: userPassword,
      });

      if (signInError) {
        console.error("Error signing in existing user:", signInError);
        return null;
      }

      // Update existing profile with latest data
      const { error: updateError } = await supabase
        .from("steam_profiles")
        .update({
          steam_username: steamUser.personaname,
          avatar_url: steamUser.avatarfull,
        })
        .eq("steam_id", steamUser.steamid);

      if (updateError) {
        console.error("Error updating steam_profiles:", updateError);
      }

      return existingUser.id;
    }

    // Create new user if doesn't exist - use backend API with admin credentials
    const signupResponse = await fetch("/api/steam-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        steamId: steamUser.steamid,
        email: userEmail,
        password: userPassword,
        steamUsername: steamUser.personaname,
        avatarUrl: steamUser.avatarfull,
      }),
    });

    const signupResponseText = await signupResponse.text();
    console.log("Steam signup response:", signupResponseText);

    let signupData;
    try {
      signupData = JSON.parse(signupResponseText);
    } catch {
      console.error("Failed to parse signup response as JSON:", signupResponseText);
      return null;
    }

    if (!signupResponse.ok || !signupData.success) {
      console.error("Auth sign up error:", signupData.error || "Unknown error");
      return null;
    }

    // Sign in the newly created user
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: userPassword,
    });

    if (signInError) {
      console.error("Error signing in new user:", signInError);
      return null;
    }

    return signupData.userId;
  } catch (error) {
    console.error("Error creating Steam user:", error);
    return null;
  }
}

export async function linkSteamAccount(
  userId: string,
  steamUser: SteamUser
): Promise<boolean> {
  try {
    // Update user metadata with Steam data
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          steam_username: steamUser.personaname,
          steam_id: steamUser.steamid,
          avatar_url: steamUser.avatarfull,
        },
      }
    );

    if (updateError) {
      console.error("Error updating user metadata:", updateError);
      return false;
    }

    // Upsert in steam_profiles table
    const { error: profileError } = await supabase
      .from("steam_profiles")
      .upsert([
        {
          id: userId,
          steam_id: steamUser.steamid,
          steam_username: steamUser.personaname,
          avatar_url: steamUser.avatarfull,
        },
      ]);

    if (profileError) {
      console.error("Error saving to steam_profiles:", profileError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error linking Steam account:", error);
    return false;
  }
}
