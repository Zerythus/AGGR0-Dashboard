import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSteam } from "@fortawesome/free-brands-svg-icons";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons/faRectangleXmark";

import { supabase } from "../services/supabaseClient";
import { deleteUserAccount } from "../services/accountService";
import { getSteamProfileData } from "../services/steamProfileService";
import { useAccessibility } from "../contexts/AccessibilityContext";
import epicLogo from "/public/icons/epic-games.svg";
import styles from "./Settings.module.css";

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { settings, setFontSizeLevel, setHighContrast, resetAccessibility } = useAccessibility();

  const [activeTab, setActiveTab] = useState("general");
  const [syncedPlatforms, setSyncedPlatforms] = useState<{ [key: string]: boolean }>(() => {
    const saved = localStorage.getItem("syncedPlatforms");
    return saved ? JSON.parse(saved) : {};
  });

  const [useSteamUsername, setUseSteamUsername] = useState(false);
  const [steamUsername, setSteamUsername] = useState("");
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const syncModalRef = useRef<HTMLDivElement>(null);
  const deleteModalRef = useRef<HTMLDivElement>(null);
  const [maxUnplayedValue, setMaxUnplayedValue] = useState<number | string>(500);
  const [isSavingMaxValue, setIsSavingMaxValue] = useState(false);

  useEffect(() => {
    const initializeSteamData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && user.user_metadata?.steam_id) {
        setUseSteamUsername(user.user_metadata?.use_steam_username === true);

        const steamProfile = await getSteamProfileData(user.id);
        if (steamProfile) {
          setSteamUsername(steamProfile.steam_username);
        }
      }

      if (user) {
        const { data, error } = await supabase
          .from("user_settings")
          .select("max_unplayed_value")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching user settings:", error);
        } else if (data) {
          setMaxUnplayedValue(data.max_unplayed_value || 500);
        }
      }
    };

    initializeSteamData();
  }, []);

  useEffect(() => {
    if (searchParams.get("syncSuccess") === "steam") {
      setSuccessMessage("Steam account synced successfully!");

      const syncedPlats = JSON.parse(localStorage.getItem("syncedPlatforms") || "{}");
      setSyncedPlatforms(syncedPlats);

      const initializeSteamData = async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && user.user_metadata?.steam_id) {
          const steamProfile = await getSteamProfileData(user.id);
          if (steamProfile) {
            setSteamUsername(steamProfile.steam_username);
          }
        }
      };

      initializeSteamData();
      setTimeout(() => setSuccessMessage(""), 3000);
      window.history.replaceState({}, document.title, "/settings");
    }

    const syncError = localStorage.getItem("steamSyncError");
    if (syncError) {
      setSuccessMessage(`Error: ${syncError}`);
      localStorage.removeItem("steamSyncError");
      setTimeout(() => setSuccessMessage(""), 5000);
      window.history.replaceState({}, document.title, "/settings");
    }
  }, [searchParams]);

  const handleSync = (platformName: string) => {
    if (platformName === "Steam") {
      const returnUrl = `${window.location.origin}/settings-callback`;
      const params = new URLSearchParams({
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.mode": "checkid_setup",
        "openid.return_to": returnUrl,
        "openid.realm": window.location.origin,
      });

      window.location.href = `https://steamcommunity.com/openid/login?${params.toString()}`;
    } else {
      const updated = { ...syncedPlatforms, [platformName]: true };
      setSyncedPlatforms(updated);
      localStorage.setItem("syncedPlatforms", JSON.stringify(updated));
      setShowSyncModal(true);
    }
  };

  const handleDisconnect = async (platformName: string) => {
    if (platformName === "Steam") {
      setIsDisconnecting(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("Not authenticated");
        }

        const response = await fetch("/api/steam-disconnect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to disconnect Steam");
        }

        const updated = { ...syncedPlatforms };
        delete updated["Steam"];
        setSyncedPlatforms(updated);
        localStorage.setItem("syncedPlatforms", JSON.stringify(updated));

        setSteamUsername("");
        setUseSteamUsername(false);

        setSuccessMessage("Steam account disconnected successfully");
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to disconnect Steam";
        setSuccessMessage(`Error: ${message}`);
        setTimeout(() => setSuccessMessage(""), 3000);
      } finally {
        setIsDisconnecting(false);
        window.dispatchEvent(new Event("userMetadataChanged"));
      }
    } else {
      const updated = { ...syncedPlatforms, [platformName]: false };
      setSyncedPlatforms(updated);
      localStorage.setItem("syncedPlatforms", JSON.stringify(updated));
    }
  };

  const handleToggleSteamUsername = async (newValue: boolean) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      const { error } = await supabase.auth.updateUser({
        data: {
          use_steam_username: newValue,
        },
      });

      if (error) {
        throw error;
      }

      setUseSteamUsername(newValue);
      window.dispatchEvent(new Event("userMetadataChanged"));
    } catch (error) {
      console.error("Failed to update username preference:", error);
    }
  };

  const handleMaxUnplayedValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d{0,1}$/.test(value)) {
      setMaxUnplayedValue(value);
    }
  };

  const handleSaveMaxUnplayedValue = async () => {
    try {
      setIsSavingMaxValue(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      const numValue = parseFloat(maxUnplayedValue as string) || 500;

      if (numValue < 0) {
        setSuccessMessage("Error: Value cannot be negative");
        setIsSavingMaxValue(false);
        setTimeout(() => setSuccessMessage(""), 3000);
        return;
      }

      const { data: existing, error: fetchError } = await supabase
        .from("user_settings")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (existing) {
        const { error } = await supabase
          .from("user_settings")
          .update({ max_unplayed_value: numValue })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_settings")
          .insert({ user_id: user.id, max_unplayed_value: numValue });

        if (error) throw error;
      }

      setMaxUnplayedValue(numValue);
      setSuccessMessage(`Max unplayed value set to $${numValue.toFixed(1)}`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save max unplayed value";
      setSuccessMessage(`Error: ${message}`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } finally {
      setIsSavingMaxValue(false);
    }
  };

  const handleBackToDashboard = () => {
    const hasSyncedPlatforms = Object.values(syncedPlatforms).some((value) => value === true);
    navigate(hasSyncedPlatforms ? "/dashboardFill" : "/dashboard");
  };

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (showSyncModal) {
          setShowSyncModal(false);
        }
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
          setDeleteError(null);
        }
      }
    }

    function handleClickOutside(event: MouseEvent) {
      if (showSyncModal && syncModalRef.current && !syncModalRef.current.contains(event.target as Node)) {
        setShowSyncModal(false);
      }

      if (showDeleteConfirm && deleteModalRef.current && !deleteModalRef.current.contains(event.target as Node)) {
        setShowDeleteConfirm(false);
        setDeleteError(null);
      }
    }

    if (showSyncModal || showDeleteConfirm) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showSyncModal, showDeleteConfirm]);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    const result = await deleteUserAccount();

    if (result.success) {
      await supabase.auth.signOut();
      localStorage.clear();
      await new Promise((resolve) => setTimeout(resolve, 300));
      navigate("/", { replace: true });
      return;
    }

    setDeleteError(result.message);
    setIsDeleting(false);
  };

  const platforms = [
    {
      name: "Steam",
      icon: faSteam,
    },
    {
      name: "Epic Games",
      icon: epicLogo,
    },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-10 mt-5">
      <button
        className="text-(--primary-color) hover:opacity-80 mb-5 text-lg rounded-sm border px-5 py-2"
        onClick={handleBackToDashboard}
      >
        &larr; Back to Dashboard
      </button>

      <h2 className="text-xl font-bold text-(--text-color)">Settings</h2>

      <div className={`flex h-10 mt-5 text-xl ${styles.settingsTabs}`}>
        <button
          onClick={() => setActiveTab("general")}
          className={`${
            activeTab === "general"
              ? "text-(--text-color) underline underline-offset-8 decoration-(--primary-color)"
              : "text-(--secondary-text-color)"
          } hover:underline hover:underline-offset-8 decoration-(--primary-color)`}
        >
          General
        </button>

        <button
          onClick={() => setActiveTab("account")}
          className={`${
            activeTab === "account"
              ? "text-(--text-color) underline underline-offset-8 decoration-(--primary-color)"
              : "text-(--secondary-text-color)"
          } hover:underline hover:underline-offset-8 decoration-(--primary-color)`}
        >
          Account Management
        </button>

        <button
          onClick={() => setActiveTab("Accessibility")}
          className={`${
            activeTab === "Accessibility"
              ? "text-(--text-color) underline underline-offset-8 decoration-(--primary-color)"
              : "text-(--secondary-text-color)"
          } hover:underline hover:underline-offset-8 decoration-(--primary-color)`}
        >
          Accessibility
        </button>
      </div>

      {activeTab === "general" && (
        <div className={`mt-5 space-y-8 ${styles.settingTab}`}>
          {successMessage && (
            <div
              className={`p-4 rounded-sm text-white ${
                successMessage.includes("Error")
                  ? "bg-red-500/20 border border-red-500/50"
                  : "bg-green-500/20 border border-green-500/50"
              }`}
            >
              {successMessage}
            </div>
          )}

          <div className="bg-(--background-color) rounded-sm p-5">
            <h3 className="text-lg font-semibold text-(--text-color)">Linked Platforms</h3>
            <p>
              Note: Steam profile data visibility must be public. Epic Games is currently using mock
              data (JSON file)
            </p>

            <div
              className={`mt-6 bg-(--background-inner-color) rounded-sm ${
                settings.highContrast ? "border border-white/20" : "border border-slate-700/40"
              }`}
            >
              {platforms.map((platform, index) => (
                <div key={platform.name}>
                  <div className={`py-6 px-6 ${styles.platformRow}`}>
                    <div className={styles.platformInfo}>
                      {typeof platform.icon === "string" ? (
                        <img src={platform.icon} alt={platform.name} className="w-10 h-10" />
                      ) : (
                        <FontAwesomeIcon
                          icon={platform.icon}
                          className="text-3xl text-(--text-color)"
                          size="2xl"
                        />
                      )}

                      <div>
                        <p className="text-xl text-(--text-color)">{platform.name}</p>
                        <p
                          className="text-lg"
                          style={{
                            color: syncedPlatforms[platform.name]
                              ? "#85C29C"
                              : "var(--secondary-text-color)",
                          }}
                        >
                          {syncedPlatforms[platform.name] ? "Connected" : "Not connected"}
                        </p>
                      </div>
                    </div>

                    <div className={styles.platformAction}>
                      {syncedPlatforms[platform.name] ? (
                        <button
                          className="text-lg px-5 py-2 rounded-sm bg-red-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleDisconnect(platform.name)}
                          disabled={isDisconnecting && platform.name === "Steam"}
                        >
                          {isDisconnecting && platform.name === "Steam"
                            ? "Disconnecting..."
                            : "Disconnect"}
                        </button>
                      ) : (
                        <button
                          className="text-lg bg-(--text-color) text-black px-5 py-2 rounded-sm hover:opacity-90"
                          onClick={() => handleSync(platform.name)}
                        >
                          Sync
                        </button>
                      )}
                    </div>
                  </div>

                  {platform.name === "Steam" && syncedPlatforms[platform.name] && steamUsername && (
                    <div className="flex items-center justify-between py-4 px-6 bg-(--background-inner-color) border-t border-(--disabled-color)">
                      <div>
                        <p className="text-lg text-(--text-color)">
                          Use Steam username as display name.
                        </p>
                      </div>

                      <button
                        onClick={() => handleToggleSteamUsername(!useSteamUsername)}
                        className={`relative w-16 min-w-16 h-9 rounded-full transition-colors shrink-0 ${
                          useSteamUsername
                            ? "bg-(--primary-color)"
                            : "bg-(--secondary-text-color)"
                        }`}
                        role="switch"
                        aria-checked={useSteamUsername}
                      >
                        <div
                          className={`absolute top-1 w-7 h-7 bg-white rounded-full transition-transform ${
                            useSteamUsername ? "translate-x-8" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  )}

                  {index !== platforms.length - 1 && (
                    <div className="border-b border-(--disabled-color)" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-(--background-color) rounded-sm p-5">
            <div className={styles.maxUnplayedContainer}>
              <div className="flex-1">
                <label className="text-(--text-color) text-lg font-semibold mb-2 block">
                  Max Unplayed Games Value (CAD)
                </label>
                <p className="text-(--secondary-text-color) text-lg mb-3">
                  When your unplayed games value reaches this amount, the value will turn yellow on
                  the dashboard metric card.
                </p>
              </div>

              <div className={`flex gap-1 ${styles.maxUnplayedInputGroup}`}>
                <span className="text-(--secondary-text-color) text-lg whitespace-nowrap my-auto">
                  CAD $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="99999"
                  inputMode="decimal"
                  value={maxUnplayedValue}
                  onChange={handleMaxUnplayedValueChange}
                  placeholder="500"
                  className={`${styles.maxInputField} rounded-sm border border-slate-300 bg-white px-2 py-2 text-right text-xl text-slate-900 outline-none`}
                />
                <button
                  onClick={handleSaveMaxUnplayedValue}
                  disabled={isSavingMaxValue}
                  className={`text-lg bg-(--primary-color) text-black px-6 py-2 rounded-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed h-fit ${styles.maxUnplayedButton}`}
                >
                  {isSavingMaxValue ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "account" && (
        <section className="mt-5 space-y-8">
          <div
            className={`bg-(--background-color) p-5 rounded-sm outline outline-white/10 ${styles.deleteAccountContainer} ${styles.settingTab}`}
          >
            <div className="flex-1">
              <h3 className="text-xl font-bold text-(--text-color)">Delete account</h3>
              <p className="mt-3 text-lg text-(--secondary-text-color)">
                This action is irreversible and will permanently remove all your data from our
                database. Please proceed with caution.
              </p>
            </div>

            <button
              className="text-lg bg-red-400 my-auto text-black px-5 py-2 rounded-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                setDeleteError(null);
                setShowDeleteConfirm(true);
              }}
              disabled={isDeleting}
            >
              <FontAwesomeIcon icon={faTriangleExclamation} />
              {isDeleting ? "Deleting..." : "Delete account"}
            </button>
          </div>
        </section>
      )}

      {showSyncModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            ref={syncModalRef}
            className="bg-(--background-color) rounded-sm p-6 max-w-lg mx-4 outline outline-white/10"
          >
            <div className="flex justify-between">
              <h3 className="text-xl font-bold text-(--text-color) mb-4">Platform connected!</h3>
              <FontAwesomeIcon
                icon={faRectangleXmark}
                style={{ color: "#29bdff" }}
                className="text-4xl cursor-pointer hover:opacity-80"
                onClick={() => {
                  setShowSyncModal(false);
                }}
              />
            </div>

            <p className="text-(--text-color) mb-6">What would you like to do next?</p>

            <div className="flex gap-3 justify-end">
              <button
                className="text-lg px-5 py-2 rounded-sm bg-(--primary-color) text-black hover:opacity-80"
                onClick={handleBackToDashboard}
              >
                Go to dashboard
              </button>
              <button
                className="text-lg px-5 py-2 rounded-sm bg-(--text-color) text-black hover:opacity-80"
                onClick={() => {
                  setShowSyncModal(false);
                }}
              >
                Link more platforms
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            ref={deleteModalRef}
            className="bg-(--background-color) rounded-sm p-6 max-w-sm mx-4 outline outline-white/10"
          >
            <h3 className="text-xl font-bold text-(--text-color) mb-4">Delete Account?</h3>

            <p className="text-(--text-color) mb-2">
              This action is permanent and cannot be undone.
            </p>

            {deleteError && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded-sm mb-4">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                className="text-lg px-5 py-2 rounded-sm bg-(--text-color) text-black hover:opacity-90 disabled:opacity-50"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </button>

              <button
                className="text-lg px-5 py-2 rounded-sm bg-red-500 text-white hover:opacity-90 disabled:opacity-50"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Accessibility" && (
        <section className="mt-5 space-y-8">
          <div
            className={`bg-(--background-color) p-5 rounded-sm outline outline-white/10 ${styles.resetAccessibilityContainer} ${styles.settingTab}`}
          >
            <div>
              <h3 className="text-xl font-bold text-(--text-color) mb-3">Zoom In/Out</h3>
              <p className="text-lg text-(--secondary-text-color)">
                Adjust the zoom level of the application.
              </p>
            </div>

            <div className="flex gap-3 my-auto">
              <button
                onClick={() => setFontSizeLevel(2)}
                className={`text-sm px-6 py-2 rounded-sm font-semibold transition-opacity ${
                  settings.fontSizeLevel === 2
                    ? "bg-(--secondary-text-color) text-(--background-color)"
                    : "bg-(--primary-color) text-black hover:opacity-90"
                }`}
              >
                Small
              </button>

              <button
                onClick={() => setFontSizeLevel(3)}
                className={`text-base px-6 py-2 rounded-sm font-semibold transition-opacity ${
                  settings.fontSizeLevel === 3
                    ? "bg-(--secondary-text-color) text-(--background-color)"
                    : "bg-(--primary-color) text-black hover:opacity-90"
                }`}
              >
                Medium
              </button>

              <button
                onClick={() => setFontSizeLevel(4)}
                className={`text-lg px-6 py-2 rounded-sm font-semibold transition-opacity ${
                  settings.fontSizeLevel === 4
                    ? "bg-(--secondary-text-color) text-(--background-color)"
                    : "bg-(--primary-color) text-black hover:opacity-90"
                }`}
              >
                Large
              </button>
            </div>
          </div>

          <div className="bg-(--background-color) p-5 rounded-sm outline outline-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-(--text-color) text-lg font-semibold mb-2">High Contrast Mode</p>
              </div>

              <button
                onClick={() => setHighContrast(!settings.highContrast)}
                className={`relative w-16 h-9 rounded-full transition-colors focus:outline-none ${
                  settings.highContrast
                    ? "bg-(--primary-color)"
                    : "bg-(--secondary-text-color)"
                }`}
                role="switch"
                aria-checked={settings.highContrast}
              >
                <div
                  className={`absolute top-1 w-7 h-7 bg-white rounded-full transition-transform ${
                    settings.highContrast ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div
            className={`bg-(--background-color) p-5 rounded-sm outline outline-white/10 ${styles.resetAccessibilityContainer}`}
          >
            <div>
              <h3 className="text-xl font-bold text-(--text-color)">
                Reset Accessibility Settings
              </h3>
              <p className="mt-3 text-lg text-(--secondary-text-color)">
                Restore all accessibility settings to their default values.
              </p>
            </div>
            <button
              onClick={resetAccessibility}
              className="text-lg bg-(--primary-color) my-auto text-black px-5 py-2 rounded-sm hover:opacity-90"
            >
              Reset
            </button>
          </div>
        </section>
      )}
    </div>
  );
}