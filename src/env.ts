function requireEnv(envName: string): string {
  const value = process.env[envName];
  if (!value) {
    console.error(`Environment variable ${envName} is not defined`);
    throw new Error(`Environment variable ${envName} is not defined`);
  }
  return value;
}

export const UP_TOKEN = requireEnv("UP_TOKEN");
export const USER_ID = requireEnv("USER_ID");
export const ACCOUNT_ID = requireEnv("ACCOUNT_ID");
export const REGION = requireEnv("REGION");
