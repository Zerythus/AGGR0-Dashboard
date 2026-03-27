import { supabase } from "./supabaseClient";

export async function deleteUserAccount() {
  try {
    const { data, error } = await supabase.functions.invoke("delete-account");

    if (error) {
      throw new Error(error.message || "Failed to delete account");
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