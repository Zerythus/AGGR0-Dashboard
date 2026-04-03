import UserMenu from "@/components/userMenu";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabaseClient";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function AppLayout() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.username) {
        setUsername(user.user_metadata.username);
        
        // Track login count
        const currentCount = parseInt(localStorage.getItem('loginCount') || '0', 10);
        localStorage.setItem('loginCount', String(currentCount + 1));
      }

      setIsAuthChecked(true);
    };

    fetchUser();
  }, [navigate]);

  // Prevent rendering until auth is verified
  if (!isAuthChecked) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col bg-(--main-background-color) text-white">
        <div className="flex items-center justify-between border-b border-white/10">
          {/* placeholder logo */}
          <motion.img 
            src="/logo/aggr0-logo.png" 
            alt="Logo" 
            className="h-10 mx-5 my-3 cursor-pointer" 
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
            onClick={() => navigate("/dashboard")}
            />
          <header className="flex h-15 items-center justify-end px-5">
            <UserMenu
              username={username}
              chevronSrc="/icons/chevron-down.svg"
              onAccountSettings={() => {
                navigate("/settings")
              }}
              onLogout={async () => {
                // Sign out from Supabase
                await supabase.auth.signOut();
                
                // Clear app-specific data
                localStorage.removeItem("syncedPlatforms");
                localStorage.removeItem("loginCount");
                
                // Clear all auth-related local storage
                const keysToRemove = Object.keys(localStorage).filter(key => 
                  key.includes("supabase") || key.includes("auth")
                );
                keysToRemove.forEach(key => localStorage.removeItem(key));
                
                // Clear all auth-related session storage
                const sessionKeysToRemove = Object.keys(sessionStorage).filter(key =>
                  key.includes("supabase") || key.includes("auth")
                );
                sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
                
                // Navigate to home
                navigate("/");
              }}
            />
          </header>
        </div>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet context={{ username }} />
        </main>
      </div>
    </div>
  );
}