import Cookies from "js-cookie";

const TOKEN_KEY = "token";
const USER_KEY = "user";

export const setUserSession = (user: object, token: string) => {
  // Store token in a cookie so it's accessible by both client and server
  Cookies.set(TOKEN_KEY, token, { expires: 1 }); // Expires in 1 day
  
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const setUser = (user: object) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const getUser = () => {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem(USER_KEY);
  if (user === "undefined" || !user) {
    return null;
  } else {
    try {
      return JSON.parse(user);
    } catch (e) {
      return null;
    }
  }
};

export const getToken = () => {
  return Cookies.get(TOKEN_KEY) || null;
};

export const resetUserSession = () => {
  Cookies.remove(TOKEN_KEY);
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_KEY);
  }
};
