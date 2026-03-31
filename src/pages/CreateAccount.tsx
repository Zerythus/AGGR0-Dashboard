import HomeHero from "@/components/homeHero";
import { ArrowLeft } from "lucide-react";
import { useId, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/services/supabaseClient";

export default function CreateAccount() {
  
  const usernameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  
  const [ username, setUsername ] = useState("");
  const [ email, setEmail ] = useState("");
  const [ password, setPassword ] = useState("");
  const [ confirmPassword, setConfirmPassword ] = useState("");

  const [ showPassword, setShowPassword ] = useState(false);
  const [ showConfirmPassword, setShowConfirmPassword ] = useState(false);
  
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleCreateAccount = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    if (!username.trim()) {
      setErrorMessage("Please enter a username.");
      return;
    } 

    if (!email.trim()) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter a password.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // Proceed with signup
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.trim(),
          },
        },
      });

      if (error) {
        // Check if it's a duplicate email error from auth
        if (error.message.includes("already registered")) {
          setErrorMessage("This email is already associated with an account.");
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      alert("Successfully created an account");
      navigate("/home");
    } 
    catch (err) {
      console.error(err);
      setErrorMessage("Something went wrong while creating your account.");
    } 
    finally {
      setLoading(false);
    }
  };

  return (
      <div className="grid h-full w-full grid-cols-1 md:grid-cols-[1.4fr_1fr]">
        {/* left */}
        <HomeHero />

        {/* right */}
        <section className="flex h-full w-full items-center-safe bg-(--background-color) px-12 border-l border-white/10">
            <div className="w-full">
                
                <ArrowLeft 
                    className="h-8 w-8 mb-6 cursor-pointer" 
                    onClick={() => navigate("/")} 
                />
                
                <h2 className="text-4xl tracking-tight">Create an account</h2>

                <form 
                    className="mt-8 space-y-6 text-lg"
                    onSubmit={handleCreateAccount}
                >
                    <div>
                        <input
                        id={usernameId}
                        type="text"
                        placeholder="Username"
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div>
                        <input
                        id={emailId}
                        type="text"
                        placeholder="Email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                                focus:outline-none"
                        >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                    </div>

                    <div className="relative">
                        <input
                        id={confirmPasswordId}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        autoComplete="confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            aria-controls={confirmPasswordId}
                            aria-pressed={showConfirmPassword}
                            className="
                                absolute right-4 top-1/2 -translate-y-1/2
                                text-slate-500 hover:text-slate-700
                                focus:outline-none"
                        >
                        {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                    </div>

                    {errorMessage && (
                        <p className="text-base text-red-400 text-center">{errorMessage}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-10 h-14 w-full rounded-md bg-(--primary-color) text-slate-950 hover:bg-(--hover-primary-color) active:bg-(--pressed-primary-color)"
                    >
                        {loading ? "Creating account..." : "Create Account"}
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