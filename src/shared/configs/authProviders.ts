export type SupportedOAuthProvider = "google" | "github";

export const supportedOAuthProviders: Array<{
  id: SupportedOAuthProvider;
  label: string;
  iconSrc: string;
  iconAlt: string;
}> = [
  {
    id: "google",
    label: "Google",
    iconSrc: "/icons/google_logo.svg",
    iconAlt: "Google",
  },
  {
    id: "github",
    label: "GitHub",
    iconSrc: "/icons/github_logo.svg",
    iconAlt: "GitHub",
  },
];
