// import { createClient } from "@supabase/supabase-js";

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
// const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

// export const supabase = createClient(supabaseUrl, supabasePublishableKey);


import { createClient } from "@supabase/supabase-js";
// Use SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY from environment (works in both local dev and Vercel)
const supabaseUrl = (import.meta.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL)!;
const supabasePublishableKey = (import.meta.env.SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)!;

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
