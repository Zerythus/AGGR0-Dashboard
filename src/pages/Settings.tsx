import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSteam } from "@fortawesome/free-brands-svg-icons";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { supabase } from "../services/supabaseClient";
import { deleteUserAccount } from "../services/accountService";
import { useAccessibility } from "../contexts/AccessibilityContext";
import epicLogo from "/public/icons/epic-games.svg";

export default function Settings() {
  const navigate = useNavigate();
  const { settings, setFontSizeLevel, setHighContrast, resetAccessibility } = useAccessibility();

  const [activeTab, setActiveTab] = useState("general");
  const [syncedPlatforms, setSyncedPlatforms] = useState<{ [key: string]: boolean }>(() => {
    const saved = localStorage.getItem("syncedPlatforms");
    return saved ? JSON.parse(saved) : {};
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleSync = (platformName: string) => {
    const updated = { ...syncedPlatforms, [platformName]: true };
    setSyncedPlatforms(updated);
    localStorage.setItem("syncedPlatforms", JSON.stringify(updated));
  };

  const handleDisconnect = (platformName: string) => {
    const updated = { ...syncedPlatforms, [platformName]: false };
    setSyncedPlatforms(updated);
    localStorage.setItem("syncedPlatforms", JSON.stringify(updated));
  };

  const handleBackToDashboard = () => {
    const hasSyncedPlatforms = Object.values(syncedPlatforms).some((value) => value === true);
    navigate(hasSyncedPlatforms ? "/dashboardFill" : "/dashboard");
  };

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

      <div className="flex h-10 mt-5 gap-3.5 text-xl">
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
        <section className="mt-5 bg-(--background-color) rounded-sm p-5">
          <h3 className="text-lg font-semibold text-(--text-color)">Linked Platforms</h3>

          <div className="mt-6 bg-(--background-inner-color) rounded-sm">
            {platforms.map((platform, index) => (
              <div key={platform.name}>
                <div className="flex items-center justify-between py-6 px-6">
                  <div className="flex items-center gap-5">
                    {typeof platform.icon === "string" ? (
                      <img src={platform.icon} alt={platform.name} className="w-10 h-10" />
                    ) : (
                      <FontAwesomeIcon
                        icon={platform.icon}
                        className="text-2xl text-(--text-color)"
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

                  {syncedPlatforms[platform.name] ? (
                    <div className="flex gap-3">
                      <button
                        className="text-lg px-5 py-2 rounded-sm bg-red-500 text-white hover:opacity-90"
                        onClick={() => handleDisconnect(platform.name)}
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      className="text-lg bg-(--text-color) text-black px-5 py-2 rounded-sm hover:opacity-90"
                      onClick={() => handleSync(platform.name)}
                    >
                      Sync
                    </button>
                  )}
                </div>

                {index !== platforms.length - 1 && (
                  <div className="border-b border-(--disabled-color)" />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "account" && (
        <section className="mt-5 space-y-8">
          <div className="bg-(--background-color) p-5 flex justify-between items-start rounded-sm outline outline-white/10">
            <div>
              <h3 className="text-xl font-bold text-(--text-color)">Change your password</h3>
              <p className="mt-3 text-lg text-(--secondary-text-color)">
                For security purposes, we recommend using a unique password that isn't used
                for any other account.
              </p>
            </div>
            <button className="text-lg bg-(--primary-color) my-auto text-black px-5 py-2 rounded-sm hover:opacity-90">
              Change Password
            </button>
          </div>

          <div className="bg-(--background-color) p-5 flex justify-between items-start rounded-sm outline outline-white/10">
            <div>
              <h3 className="text-xl font-bold text-(--text-color)">Delete account</h3>
              <p className="mt-3 text-lg text-(--secondary-text-color)">
                This action is irreversible and will permanently remove all your data from
                our servers. Please proceed with caution.
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

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-(--background-color) rounded-sm p-6 max-w-sm mx-4 outline outline-white/10">
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
          {/* Font Size Control */}
          <div className="bg-(--background-color) p-5 rounded-sm outline outline-white/10">
            <h3 className="text-xl font-bold text-(--text-color) mb-3">Text Size</h3>
            <p className="text-lg text-(--secondary-text-color) mb-6">
              Adjust the size of text throughout the application.
            </p>

            <div className="flex items-center gap-4 mb-6">
              {/* Decrease Button */}
              <button
                onClick={() => setFontSizeLevel(settings.fontSizeLevel - 1)}
                disabled={settings.fontSizeLevel === 2}
                className="text-lg px-4 py-2 rounded-sm bg-(--primary-color) text-black hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                A−
              </button>

              {/* Size Display */}
              <div className="flex-1">
                <div className="bg-(--background-inner-color) rounded-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-(--secondary-text-color) text-base">Text Preview</span>
                    <span className="text-(--text-color) text-sm font-semibold">
                      Level {settings.fontSizeLevel - 1}/3
                    </span>
                  </div>
                  <p
                    className="text-(--text-color)"
                    data-no-scale="true"
                    style={{
                      fontSize: `calc(18px * ${[0.9, 1, 1.1][settings.fontSizeLevel - 2]})`,
                    }}
                  >
                    The quick brown fox jumps over the lazy dog
                  </p>
                </div>
              </div>

              {/* Increase Button */}
              <button
                onClick={() => setFontSizeLevel(settings.fontSizeLevel + 1)}
                disabled={settings.fontSizeLevel === 4}
                className="text-lg px-4 py-2 rounded-sm bg-(--primary-color) text-black hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                A+
              </button>
            </div>
          </div>

          {/* High Contrast Mode */}
          <div className="bg-(--background-color) p-5 rounded-sm outline outline-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-(--text-color) text-lg font-semibold mb-2">High Contrast Mode</p>
                <p className="text-(--secondary-text-color) text-lg">
                  {settings.highContrast
                    ? "Enabled - Using optimized colors for better visibility"
                    : "Disabled - Using standard color scheme"}
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => setHighContrast(!settings.highContrast)}
                className={`relative w-16 h-9 rounded-full transition-colors focus:outline-none ${
                  settings.highContrast ? "bg-(--primary-color)" : "bg-(--secondary-text-color)"
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

          {/* Reset Accessibility Settings */}
          <div className="bg-(--background-color) p-5 flex justify-between items-start rounded-sm outline outline-white/10">
            <div>
              <h3 className="text-xl font-bold text-(--text-color)">Reset Accessibility Settings</h3>
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