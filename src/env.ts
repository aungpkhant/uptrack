import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

function requireEnv(envName: string): string {
  const value = process.env[envName];
  if (!value) {
    console.error(`Environment variable ${envName} is not defined`);
    throw new Error(`Environment variable ${envName} is not defined`);
  }
  return value;
}

const REGION = requireEnv('REGION');

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

export { REGION, getParameter };
