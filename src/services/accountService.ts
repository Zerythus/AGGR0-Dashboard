import { supabase } from "./supabaseClient";

export async function deleteUserAccount() {
  try {
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Call API endpoint to delete account
    const response = await fetch("/api/delete-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || "Failed to delete account");
    }

    return {
      success: true,
      message: "Account deleted successfully",
      data,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return {
      success: false,
      message,
    };
  }
}