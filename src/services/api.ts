import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL;

if (!BASE_URL && typeof window === "undefined") {
  console.warn(
    "Warning: NEXT_PUBLIC_BASE_URL is not defined on the server. API calls may fail or point to localhost.",
  );
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to attach the token automatically
api.interceptors.request.use(async (config) => {
  let token: string | undefined;

  if (typeof window !== "undefined") {
    // Client-side: use js-cookie
    token = Cookies.get("token");
  } else {
    // Server-side: use next/headers
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      token = cookieStore.get("token")?.value;
    } catch (error) {
      console.error("Error accessing cookies on server:", error);
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
