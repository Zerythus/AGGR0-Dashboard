import UserMenu from "@/components/userMenu";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabaseClient";
import { getSteamProfileData } from "@/services/steamProfileService";
import { useSyncSteamMetadata } from "@/hooks/useSyncSteamMetadata";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons/faArrowUp';

export default function AppLayout() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  useSyncSteamMetadata();

  const fetchAndSetDisplayName = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/");
      return;
    }

    await supabase.auth.refreshSession();

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      let displayName = "";
      
      const useSteamUsername = user.user_metadata?.use_steam_username === true;
      
      if (useSteamUsername && user.user_metadata?.steam_id) {
        const steamProfile = await getSteamProfileData(user.id);
        if (steamProfile) {
          displayName = steamProfile.steam_username;
        }
      }
      
      if (!displayName) {
        const regularUsername = user.user_metadata?.username;
        displayName = regularUsername || user.email?.split('@')[0] || "User";
      }
      
      setUsername(displayName);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      await fetchAndSetDisplayName();
      const currentCount = parseInt(localStorage.getItem('loginCount') || '0', 10);
      localStorage.setItem('loginCount', String(currentCount + 1));
      setIsAuthChecked(true);
    };

    initializeAuth();
  }, [navigate]);

  useEffect(() => {
    const handleMetadataChange = () => {
      fetchAndSetDisplayName();
    };

    window.addEventListener('userMetadataChanged', handleMetadataChange);
    return () => window.removeEventListener('userMetadataChanged', handleMetadataChange);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isAuthChecked) {
    return null;
  }

  return (
    <div className="flex min-h-screen max-w-full overflow-x-hidden relative">
      <div className="flex min-w-0 flex-1 flex-col bg-(--main-background-color) text-white">
        <div className="flex items-center justify-between border-b border-white/10">
          <motion.img 
            src="/logo/aggr0-logo.png" 
            alt="Logo" 
            className="h-8 mx-5 my-3 cursor-pointer" 
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
            onClick={() => navigate("/dashboard")}
          />
          <header className="flex h-15 items-center justify-end px-5">
            <UserMenu
              username={username}
              chevronSrc="/icons/chevron-down.svg"
              onAccountSettings={() => navigate("/settings")}
              onLogout={async () => {
                await supabase.auth.signOut();
                localStorage.removeItem("syncedPlatforms");
                localStorage.removeItem("loginCount");

                const keysToRemove = Object.keys(localStorage).filter(key => 
                  key.includes("supabase") || key.includes("auth")
                );
                keysToRemove.forEach(key => localStorage.removeItem(key));

                const sessionKeysToRemove = Object.keys(sessionStorage).filter(key =>
                  key.includes("supabase") || key.includes("auth")
                );
                sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));

                navigate("/");
              }}
            />
          </header>
        </div>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet context={{ username }} />
        </main>
              {showBackToTop && ( 
                <button onClick={scrollToTop} 
                  className="fixed bottom-5 right-5 bg-(--primary-color) text-black p-3 rounded-full hover:opacity-80 transition-opacity z-50" aria-label="Back to top" > 
                  <FontAwesomeIcon icon={faArrowUp} className="text-xl" /> 
                </button> )
              }
      </div>
    </div>
  );
}