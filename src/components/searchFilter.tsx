import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons/faSearch";
import { faXmark } from "@fortawesome/free-solid-svg-icons/faXmark";

export default function SearchFilter ({searchTerm, setSearchTerm, onFocus, onChange, onClear}: {searchTerm: string, setSearchTerm: (term: string) => void, onFocus?: () => void, onChange?: () => void, onClear?: () => void}) {
        const handleClearClick = () => {
            if (onClear) {
                onClear();
            } else {
                setSearchTerm("");
            }
        };
        return (
            <div className="flex items-center rounded-sm border border-slate-400/70 bg-white px-5 w-full mt-5">
                <FontAwesomeIcon icon={faSearch} className="mr-4 h-10 w-10 text-slate-900" strokeWidth={2.2} />
                
                <input
                    type="text"
                    placeholder="Search for a game"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        onChange?.();
                    }}
                    onFocus={onFocus}
                    className="w-full bg-transparent text-xl text-slate-950 outline-none placeholder:text-slate-500"
                />
                
                {searchTerm && (
                    <button
                        type="button"
                        onClick={handleClearClick}
                        className="ml-3 rounded-sm p-1 text-slate-900 transition hover:bg-slate-200"
                        aria-label="Clear search"
                    >
                        <FontAwesomeIcon icon={faXmark} className="h-10 w-10" strokeWidth={2.2} />
                    </button>
                )}
            </div>
        );
    }