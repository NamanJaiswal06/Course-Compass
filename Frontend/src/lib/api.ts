// lib/api.ts
// Central API service for communicating with the Express backend

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

export function setToken(token: string) {
  localStorage.setItem("admin_token", token);
}

export function clearToken() {
  localStorage.removeItem("admin_token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");
  return data as { token: string; email: string };
}

export async function apiSignup(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Signup failed");
  return data as { token: string; email: string };
}

// ─── Courses API ──────────────────────────────────────────────────────────────

export interface BackendCourse {
  _id: string;
  course_id: string;
  title: string;
  description: string;
  category: string;
  instructor: string;
  duration: string;
}

export async function apiGetAllCourses(): Promise<BackendCourse[]> {
  const cacheKey = 'client_cache_all_courses';
  if (typeof window !== 'undefined') {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  const res = await fetch(`${API_BASE}/courses`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch courses");

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
  }
  return data;
}

export async function apiSearchCourses(query: string): Promise<BackendCourse[]> {
  const cacheKey = `client_cache_search_${query}`;
  if (typeof window !== 'undefined') {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  const res = await fetch(`${API_BASE}/courses/search?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Search failed");

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
  }
  return data;
}

export async function apiUploadCourses(file: File): Promise<{ message: string; count: number }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/courses/upload`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Upload failed");
  
  if (typeof window !== 'undefined') {
    // Clear the cache so newly uploaded courses show up
    sessionStorage.removeItem('client_cache_all_courses');
    // We could clear specific search caches, but the simplest approach is to clear all or just the all_courses one. 
    // Usually, users will refresh the default list after upload.
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('client_cache_search_')) sessionStorage.removeItem(key);
    });
  }

  return data;
}

// ─── AI Recommendations API ───────────────────────────────────────────────────

export interface Recommendation {
  title: string;
  description: string;
  matchReason: string;
}

export async function apiGetRecommendations(
  topic: string,
  level: string
): Promise<{ recommendations: Recommendation[]; source: string }> {
  const res = await fetch(`${API_BASE}/recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, level }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to get recommendations");
  return data;
}
