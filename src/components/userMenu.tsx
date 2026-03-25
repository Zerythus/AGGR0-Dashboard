import { useState } from "react";
type UserMenuProps = {
  username: string;
  chevronSrc?: string;
  onAccountSettings?: () => void;
  onLogout: () => void;
};

export default function UserMenu({
  username,
  chevronSrc = "/public/icons/chevron-down.svg",
  onAccountSettings,
  onLogout,
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex px-4 py-2 items-center gap-2 text-xl text-(--text-color) font-medium hover:opacity-80"
      >
        {username}
        <img src={chevronSrc} alt="Toggle menu" className="h-3 w-3" />
      </button>

      {isOpen && (
        <div className="absolute right-0 w-50 bg-(--background-color2) text-xl">
           <button
            onClick={onAccountSettings}
            className="block px-4 py-2 text-right text-(--text-color) hover:opacity-80"
          >
            Settings
          </button>

          <button
            onClick={onLogout}
            className="block px-4 py-2 text-right text-(--text-color) hover:opacity-80"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}