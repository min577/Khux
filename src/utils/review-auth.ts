import { useState, useEffect } from "react";
import { API_BASE_URL } from "./supabase-client";
import { publicAnonKey } from "/utils/supabase/info";

const TOKEN_KEY = "khux_review_token";

export function getReviewToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setReviewToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearReviewToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export interface ReviewUser {
  discord_id: string;
  display_name: string;
  avatar: string | null;
  team: string;
  team_name: string;
  is_leader: boolean;
}

export async function reviewApiFetch(path: string, options: RequestInit = {}) {
  const token = getReviewToken();
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${publicAnonKey}`);
  if (token) headers.set("x-review-token", token);

  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
}

export function useReviewUser() {
  const [user, setUser] = useState<ReviewUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getReviewToken();
    if (!token) {
      setLoading(false);
      return;
    }

    reviewApiFetch("/discord/me")
      .then((res) => {
        if (res.ok) return res.json();
        clearReviewToken();
        return null;
      })
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => clearReviewToken())
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await reviewApiFetch("/discord/logout", { method: "POST" }).catch(() => {});
    clearReviewToken();
    setUser(null);
  };

  return { user, loading, logout };
}
