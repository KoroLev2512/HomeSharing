import { jwtDecode } from "jwt-decode";
import Cookie from "js-cookie";
import type { IBoxCard } from "@/shared/utils/store/cards";

export interface UserDetails {
  id?: string
  sub?: string
  email_verified?: boolean
  allowed_origins?: string[]
  roles?: string[] | null
  issuer?: string
  preferred_username?: string
  given_name: string
  family_name: string
  sid?: string
  acr?: string
  azp?: string
  scope?: string
  email: string
  hasAvatar?: boolean
  body?: {
    link: string
  }
  boxes?: IBoxCard[]
}

class AuthStorage {
  private static readonly COOKIE_KEYS = {
    ACCESS_TOKEN: "auth_access_token",
    REFRESH_TOKEN: "auth_refresh_token",
    USER_DETAILS: "auth_user_details",
  };

  setAccessToken(accessToken: string): void {
    const decodedToken = jwtDecode<{ exp: number }>(accessToken);
    console.log("[AUTH_STORAGE] Decoded token (exp):", decodedToken);
    const exp = decodedToken.exp;
    Cookie.remove(AuthStorage.COOKIE_KEYS.ACCESS_TOKEN);
    Cookie.set(AuthStorage.COOKIE_KEYS.ACCESS_TOKEN, accessToken, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      expires: new Date(exp * 1000),
    });

    try {
      const userDetails: UserDetails = jwtDecode<UserDetails>(accessToken);
      console.log("[AUTH_STORAGE] Decoded user details:", userDetails);
      userDetails.id = userDetails.sub;
      userDetails.hasAvatar = false;
      Cookie.remove(AuthStorage.COOKIE_KEYS.USER_DETAILS);
      Cookie.set(AuthStorage.COOKIE_KEYS.USER_DETAILS, JSON.stringify(userDetails), {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        expires: new Date(exp * 1000),
      });
    }
    catch (error) {
      console.error("[AUTH_STORAGE] Failed to parse access token:", error);
    }
    console.log("Access Token:", this.getAccessToken());
    console.log("Refresh Token:", this.getRefreshToken());
  }

  setRefreshToken(refreshToken: string): void {
    const exp = jwtDecode<{ exp: number }>(refreshToken).exp;
    Cookie.remove(AuthStorage.COOKIE_KEYS.REFRESH_TOKEN);
    Cookie.set(AuthStorage.COOKIE_KEYS.REFRESH_TOKEN, refreshToken, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      expires: new Date(exp * 1000),
    });
  }

  getAccessToken(): string | undefined {
    return Cookie.get(AuthStorage.COOKIE_KEYS.ACCESS_TOKEN);
  }

  getRefreshToken(): string | undefined {
    return Cookie.get(AuthStorage.COOKIE_KEYS.REFRESH_TOKEN);
  }

  async getUserDetails(): Promise<UserDetails | null> {
    const userData = Cookie.get(AuthStorage.COOKIE_KEYS.USER_DETAILS);
    if (!userData) {
      const token = this.getAccessToken();
      if (token) {
        try {
          const userDetails: UserDetails = jwtDecode<UserDetails>(token);
          userDetails.id = userDetails.sub;
          return userDetails;
        }
        catch (error) {
          console.error("[AUTH_STORAGE] Failed to decode access token:", error);
          return null;
        }
      }
      console.warn("[AUTH_STORAGE] No user data found in cookies.");
      return null;
    }
    else {
      console.log("[AUTH_STORAGE] Retrieved user data:", userData);
    }
    const userDataParsed: UserDetails = JSON.parse(userData);
    console.log(userDataParsed);
    try {
      // const response = await fetch(`https://api.lockboxes.ru:8445/avatars/get?sub=${userDataParsed.id}`);
      const response = await fetch(`https://api.lockboxes.ru:9000/avatars/${userDataParsed.id}`);
      if (response.ok) {
        userDataParsed.hasAvatar = true;
      }
    }
    catch (error) {
      console.error("Error checking avatar:", error);
    }
    return userDataParsed;
  }

  clearAccessToken(): void {
    Cookie.remove(AuthStorage.COOKIE_KEYS.ACCESS_TOKEN);
    Cookie.remove(AuthStorage.COOKIE_KEYS.USER_DETAILS);
  }

  clearRefreshToken(): void {
    Cookie.remove(AuthStorage.COOKIE_KEYS.REFRESH_TOKEN);
  }

  clearAuth(): void {
    this.clearAccessToken();
    this.clearRefreshToken();
  }

  setBoxes(boxes: IBoxCard[]): void {
    const userRaw = Cookie.get(AuthStorage.COOKIE_KEYS.USER_DETAILS);
    if (!userRaw) return;

    try {
      const userDetails: UserDetails = JSON.parse(userRaw);
      userDetails.boxes = boxes;

      Cookie.set(AuthStorage.COOKIE_KEYS.USER_DETAILS, JSON.stringify(userDetails), {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 дней
      });
    }
    catch (err) {
      console.error("[AUTH_STORAGE] Failed to update boxes in user details:", err);
    }
  }

  getBoxes(): IBoxCard[] {
    const raw = Cookie.get(AuthStorage.COOKIE_KEYS.USER_DETAILS);
    if (!raw) return [];

    try {
      const user: UserDetails = JSON.parse(raw);
      return user.boxes ?? [];
    }
    catch (e) {
      return [];
    }
  }
}

const authStorage = new AuthStorage();
export default authStorage;
