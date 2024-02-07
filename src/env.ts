import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

function requireEnv(envName: string): string {
  const value = process.env[envName];
  if (!value) {
    console.error(`Environment variable ${envName} is not defined`);
    throw new Error(`Environment variable ${envName} is not defined`);
  }
  return value;
}

const UP_TOKEN = requireEnv("UP_TOKEN");
const USER_ID = requireEnv("USER_ID");
const ACCOUNT_ID = requireEnv("ACCOUNT_ID");
const REGION = requireEnv("REGION");
const SPREADHSHEET_ID = requireEnv("SPREADHSHEET_ID");
const SYNC_DAYS_AGO = parseInt(requireEnv("SYNC_DAYS_AGO"));

const client = new SSMClient({ region: REGION });

async function getParameter(name: string, withDecryption: boolean) {
  const input = {
    Name: name,
    WithDecryption: withDecryption,
  };
  const command = new GetParameterCommand(input);

  try {
    const response = await client.send(command);
    return response.Parameter?.Value;
  } catch (e) {
    console.error(e);
  }
}

export {
  UP_TOKEN,
  USER_ID,
  ACCOUNT_ID,
  REGION,
  SPREADHSHEET_ID,
  SYNC_DAYS_AGO,
  getParameter,
};
