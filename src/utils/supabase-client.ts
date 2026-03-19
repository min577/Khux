import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "/utils/supabase/info";

// Create a singleton Supabase client for the frontend
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

// API base URL for server endpoints
export const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d0140d55`;

// Helper to call the API with proper auth headers
export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  // Anon key for Supabase gateway auth
  headers.set("Authorization", `Bearer ${publicAnonKey}`);

  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
}

// Upload image to Supabase Storage and return the public URL
export async function uploadImage(file: File): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { error } = await supabase.storage
    .from("images")
    .upload(filePath, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from("images")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// Helper for authenticated API calls (includes user token)
export async function apiFetchAuth(path: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${session.access_token}`);

  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
}
