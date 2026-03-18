import { useState, useEffect, useCallback } from "react";

export type UsernameStatus = "idle" | "checking" | "saving" | "saved" | "error";

export function useUsername(address: string | null) {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<UsernameStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetchUsername = useCallback(async (addr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/username/${addr.toLowerCase()}`);
      if (res.ok) {
        const data = await res.json() as { username: string };
        setUsername(data.username);
      } else {
        setUsername(null);
      }
    } catch {
      setUsername(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (address) {
      fetchUsername(address);
    } else {
      setUsername(null);
    }
  }, [address, fetchUsername]);

  const checkAvailability = useCallback(async (name: string): Promise<{ available: boolean; reason?: string }> => {
    if (!name) return { available: false, reason: "Enter a username" };
    try {
      const res = await fetch(`/api/username/check/${encodeURIComponent(name)}`);
      return await res.json() as { available: boolean; reason?: string };
    } catch {
      return { available: false, reason: "Network error" };
    }
  }, []);

  const claimUsername = useCallback(async (name: string) => {
    if (!address) return;
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, username: name }),
      });
      const data = await res.json() as { username?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to claim username");
        // If already has one, refresh
        if (data.username) setUsername(data.username);
        setStatus("error");
      } else {
        setUsername(data.username ?? name);
        setStatus("saved");
      }
    } catch {
      setError("Network error — please try again");
      setStatus("error");
    }
  }, [address]);

  return { username, loading, status, error, checkAvailability, claimUsername };
}
