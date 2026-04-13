import { useState } from "react";
import api from "@/lib/api";

export interface UserResult {
  id: string;
  name: string;
  email: string;
}

export function useUserSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<UserResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function search(email: string): Promise<UserResult | null> {
    const trimmed = email.trim();
    if (!trimmed) {
      setResult(null);
      setError(null);
      return null;
    }
    setIsSearching(true);
    setError(null);
    try {
      const res = await api.get<UserResult>("/users/search", {
        params: { email: trimmed },
      });
      setResult(res.data);
      return res.data;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setResult(null);
      setError(status === 404 ? "No user found with that email." : "Search failed.");
      return null;
    } finally {
      setIsSearching(false);
    }
  }

  function clear() {
    setResult(null);
    setError(null);
  }

  return { search, clear, result, error, isSearching };
}
