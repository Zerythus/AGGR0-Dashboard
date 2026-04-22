const REMEMBER_ME_KEY = "aggr0_remembered_credentials";

interface Credentials {
  email: string;
  password: string;
}

export function saveRememberedCredentials(email: string, password: string): void {
  localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify({ email, password }));
}

export function getRememberedCredentials(): Credentials | null {
  const stored = localStorage.getItem(REMEMBER_ME_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function clearRememberedCredentials(): void {
  localStorage.removeItem(REMEMBER_ME_KEY);
}
