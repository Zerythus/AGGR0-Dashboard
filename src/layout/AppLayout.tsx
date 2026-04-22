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
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(null);

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
    if (!scrollContainer) return;

    const handleScroll = () => {
      setShowBackToTop(scrollContainer.scrollTop > 300);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [scrollContainer]);

  const scrollToTop = () => {
    scrollContainer?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isAuthChecked) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col bg-(--main-background-color) text-white">

        {/* HEADER */}
        <div className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-(--main-background-color)">
          <motion.img
            src="/logo/aggr0-logo.png"
            alt="Logo"
            className="h-8 max-[425px]:h-5 mx-5 my-3 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
            onClick={() => navigate("/dashboard")}
          />

          <header className="flex h-15 items-center justify-end px-1 max-w-[50%]">
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

        {/* SCROLL AREA */}
        <main
          ref={(el) => setScrollContainer(el)}
          className="min-w-0 flex-1 overflow-y-auto"
        >
          <Outlet context={{ username }} />
        </main>

        {/* BACK TO TOP */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-5 right-5 bg-(--primary-color) text-black p-3 rounded-full hover:opacity-80 transition-opacity z-50"
            aria-label="Back to top"
          >
            <FontAwesomeIcon icon={faArrowUp} className="text-xl" />
          </button>
        )}
      </div>
    </div>
  );
}