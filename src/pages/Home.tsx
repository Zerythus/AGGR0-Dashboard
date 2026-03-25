// LOGIN LANDING PAGE
import HomeHero from "@/components/homeHero";
import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/services/supabaseClient";

export default function Home() {
  const [showPassword, setShowPassword] = useState(false);
  const emailId = useId();
  const passwordId = useId();
  const navigate = useNavigate();

  const [ email, setEmail ] = useState("");
  const [ password, setPassword ] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

        if (error) {
            console.error(error.message);
            return;
        }

        if (!email.trim()){
            setErrorMessage("Email not found.");
            return;
        }

        if (!password) {
            setErrorMessage("Invalid credentials.");
            return;
        }

        navigate("/dashboard");
    };

  return (
      <div className="grid h-full w-full grid-cols-1 md:grid-cols-[1.4fr_1fr]">
        {/* left */}
        <HomeHero />

        {/* right */}
        <section className="flex h-full items-center bg-(--background-color) px-12 border-l border-white/10">
        <div className="w-full max-w-2xl">
            <h2 className="text-4xl tracking-tight">Welcome!</h2>

            <form 
                className="mt-8 space-y-6 text-lg"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleLogin();
                }}
            >
            <div>
                <input
                id={emailId}
                type="text"
                placeholder="Email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                />
            </div>

            <div className="relative">
                <input
                id={passwordId}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                />
                <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-controls={passwordId}
                    aria-pressed={showPassword}
                    className="
                        absolute right-4 top-1/2 -translate-y-1/2
                        text-slate-500 hover:text-slate-700
                        focus:outline-none
                    "
                >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
            </div>

            <div className="flex items-center justify-between text-lg text-white/75">
                <label className="flex items-center gap-3">
                <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/30 bg-transparent text-[#2EB8FF] focus:ring-[#2EB8FF]"
                />
                Remember me
                </label>

                <a href="#" className="hover:text-white">
                Forgot password?
                </a>
            </div>

            <button
                type="submit"
                className="h-14 w-full rounded-sm bg-(--primary-color) text-slate-950 hover:bg-(--hover-primary-color) active:bg-(--pressed-primary-color)"
            >
                Log in
            </button>
            {/* <div className="flex items-center gap-3 pt-2">
                <div className="h-px flex-1 bg-white/15" />
                <span className="text-base text-white/60">or log in with</span>
                <div className="h-px flex-1 bg-white/15" />
            </div> */}

            {/* Google - to add Steam or Discord, time permitted, otherwise, just keep google */}
            {/* <div className="flex justify-center">
                <button
                    type="button"
                    className="
                        flex h-12 w-30 items-center justify-center gap-3 text-base
                        rounded-sm border border-white/35
                        bg-transparent text-white/90
                        hover:bg-white/10
                    "
                    >
                    <img
                        src="/public/icons/google.svg"
                        alt=""
                        className="h-5 w-5"
                        aria-hidden="true"
                    />
                    <span>Google</span>
                </button>
            </div> */}

            <button
                type="button"
                className="h-14 w-full rounded-sm border border-[#2EB8FF] bg-transparent text-[#2EB8FF] hover:bg-[#2EB8FF]/10 mt-15"
                onClick={() => navigate("/create-account")}
            >
                Create new account
            </button>
            </form>

        </div>
        </section>
      </div>
  );
}

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 2.42-4.42" />
      <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c6.5 0 10 8 10 8a19.77 19.77 0 0 1-3.17 4.39" />
      <path d="M6.11 6.11A19.77 19.77 0 0 0 2 12s3.5 8 10 8a10.94 10.94 0 0 0 2.12-.24" />
      <path d="M2 2l20 20" />
    </svg>
  );
}