export type SupportedOAuthProvider = "google" | "github" | "esia";

export const supportedOAuthProviders: Array<{
  id: SupportedOAuthProvider;
  label: string;
  iconSrc: string;
  iconAlt: string;
}> = [
  {
    id: "esia",
    label: "Госуслуги",
    iconSrc: "/icons/gosuslugi_logo.svg",
    iconAlt: "Госуслуги",
  },
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
