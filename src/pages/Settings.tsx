import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSteam } from "@fortawesome/free-brands-svg-icons"
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons"
import epicLogo from "/public/icons/epic-games.svg"

export default function Settings() {

  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("general")
  const [syncedPlatforms, setSyncedPlatforms] = useState<{ [key: string]: boolean }>(() => {
    const saved = localStorage.getItem("syncedPlatforms")
    return saved ? JSON.parse(saved) : {}
  })

  const handleSync = (platformName: string) => {
    const updated = { ...syncedPlatforms, [platformName]: true }
    setSyncedPlatforms(updated)
    localStorage.setItem("syncedPlatforms", JSON.stringify(updated))
  }

  const handleDisconnect = (platformName: string) => {
    const updated = { ...syncedPlatforms, [platformName]: false }
    setSyncedPlatforms(updated)
    localStorage.setItem("syncedPlatforms", JSON.stringify(updated))
  }

  const handleBackToDashboard = () => {
    const hasSyncedPlatforms = Object.values(syncedPlatforms).some(value => value === true)
    navigate(hasSyncedPlatforms ? "/dashboardFill" : "/dashboard")
  }

  const platforms = [
    {
      name: "Steam",
      icon: faSteam
    },
    {
      name: "Epic Games",
      icon: epicLogo
    }
  ]

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-10">

      { /* Back to dashboard - will depend if the dashboard is filled or not */ }
      <button
        className="text-(--primary-color) hover:opacity-80 mb-5 text-lg rounded-sm border px-5 py-2"
        onClick={handleBackToDashboard}
      >
        &larr; Back to Dashboard
      </button>

      {/* Title */}
      <h2 className="text-xl font-bold text-(--text-color)">
        Settings
      </h2>

      {/* Tabs */}
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
      </div>

      {/* GENERAL TAB */}
      {activeTab === "general" && (
        <section className="mt-5 bg-(--background-color) rounded-sm p-5">
          <h3 className="text-lg font-semibold text-(--text-color)">
            Linked Platforms
          </h3>

          <div className="mt-6 bg-(--background-inner-color) rounded-sm">
            {platforms.map((platform, index) => (
              <div key={platform.name}>
                <div className="flex items-center justify-between py-6 px-6">
                  <div className="flex items-center gap-5">

                    {/* The platform icons have different formats (Steam - FA icon; Epic - svg) */}
                    {typeof platform.icon === 'string' ? (
                      <img src={platform.icon} alt={platform.name} className="w-10 h-10" />
                    ) : (
                      <FontAwesomeIcon
                        icon={platform.icon}
                        className="text-2xl text-(--text-color)"
                        size={"2xl"}
                      />
                    )}

                    <div>
                      <p className="text-xl text-(--text-color)">
                        {platform.name}
                      </p>
                      <p 
                        className="text-lg"
                        style={{ color: syncedPlatforms[platform.name] ? "#85C29C" : "var(--secondary-text-color)" }}
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

      {/* ACCOUNT TAB */}
      {activeTab === "account" && (
        <section className="mt-5 space-y-8">
          
          {/* Account Info */}
          {/* <div className="bg-(--background-color) p-5 rounded-sm outline outline-white/10">
            <h3 className="text-xl font-bold text-(--text-color)">
              Account Information
            </h3>

            <div className="mt-5 bg-(--background-inner-color) rounded-sm p-5">
              <p className="mb-5 text-lg text-(--text-color)">
                Manage your account's details.
              </p>
              <div className="grid lg:grid-cols-3 gap-5">
                <div>
                  <input
                    type="text"
                    value={username}
                    disabled={!editing}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-(--disabled-color) text-black px-4 py-3 rounded-sm"
                  />
                </div>

                <button
                  onClick={() => setEditing(!editing)}
                  className="bg-(--primary-color) w-10 h-10 rounded-sm flex items-center justify-center my-auto"
                >
                  <FontAwesomeIcon icon={faPen} />
                </button>

                <div>
                  <input
                    type="text"
                    value="Email address (read-only)"
                    readOnly
                    className="w-full bg-(--disabled-color) text-black px-4 py-3 rounded-sm"
                  />
                </div>
              </div>
            </div>
          </div> */}

          {/* Change Password */}
          <div className="bg-(--background-color) p-5 flex justify-between items-start rounded-sm outline outline-white/10">
            <div>
              <h3 className="text-xl font-bold text-(--text-color)">
                Change your password
              </h3>
              <p className="mt-3 text-lg text-(--text-color)">
                For security purposes, we recommend using a unique password that isn't used for any other account.
              </p>
            </div>
            <button className="text-lg bg-(--primary-color) my-auto text-black px-5 py-2 rounded-sm hover:opacity-90">
              Change Password
            </button>
          </div>

          {/* Delete Account */}
          <div className="bg-(--background-color) p-5 flex justify-between items-start rounded-sm outline outline-white/10">
            <div>
              <h3 className="text-xl font-bold text-(--text-color)">
                Delete account
              </h3>
              <div className="mt-3 text-lg text-(--text-color)">
                <p>
                  Delete your AGGRO account. 
                </p>
                <p>
                  This action is irreversible and will permanently remove all your data from our servers. Please proceed with caution.
                </p>
              </div>
            </div>

            <button className="text-lg bg-red-400 my-auto text-black px-5 py-2 rounded-sm flex items-center gap-2 hover:opacity-90">
              <FontAwesomeIcon icon={faTriangleExclamation} />
              Delete account
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
