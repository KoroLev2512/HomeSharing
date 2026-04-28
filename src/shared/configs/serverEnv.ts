import "server-only";

const requireEnv = (name: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const optionalPair = (
  valueName: string,
  value: string | undefined,
  secretName: string,
  secret: string | undefined,
) => {
  if (!value && !secret) {
    return null;
  }

  if (!value || !secret) {
    throw new Error(
      `Incomplete environment configuration: ${valueName} and ${secretName} must be set together.`,
    );
  }

  return {
    clientId: value,
    clientSecret: secret,
  };
};

export const serverEnv = {
  nextAuthSecret: requireEnv("NEXTAUTH_SECRET", process.env.NEXTAUTH_SECRET),
  github: optionalPair(
    "GITHUB_ID",
    process.env.GITHUB_ID,
    "GITHUB_SECRET",
    process.env.GITHUB_SECRET,
  ),
  google: optionalPair(
    "GOOGLE_CLIENT_ID",
    process.env.GOOGLE_CLIENT_ID,
    "GOOGLE_CLIENT_SECRET",
    process.env.GOOGLE_CLIENT_SECRET,
  ),
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  databaseUrl: process.env.DATABASE_URL,
};
