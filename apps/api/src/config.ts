import type { SplunkEnv } from '@synt/splunk';

export interface AppConfig extends SplunkEnv {
  PORT: number;
  PUBLIC_BASE_URL: string;
  WEB_ORIGIN: string;
  MONGODB_URI?: string;
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET?: string;
}

export function loadConfig(): AppConfig {
  const env = process.env;
  const port = Number(env.PORT ?? 3001);
  return {
    PORT: port,
    PUBLIC_BASE_URL: env.PUBLIC_BASE_URL ?? `http://localhost:${port}`,
    WEB_ORIGIN: env.WEB_ORIGIN ?? '*',
    MONGODB_URI: env.MONGODB_URI,
    USE_MOCK_SPLUNK: env.USE_MOCK_SPLUNK ?? 'true',
    SPLUNK_MCP_URL: env.SPLUNK_MCP_URL,
    SPLUNK_MCP_TOKEN: env.SPLUNK_MCP_TOKEN,
    SPLUNK_TOKEN: env.SPLUNK_TOKEN,
    SPLUNK_HEC_URL: env.SPLUNK_HEC_URL,
    SPLUNK_HEC_TOKEN: env.SPLUNK_HEC_TOKEN,
    SPLUNK_MODEL_ENDPOINT: env.SPLUNK_MODEL_ENDPOINT,
    SPLUNK_MODEL_TOKEN: env.SPLUNK_MODEL_TOKEN,
    SPLUNK_MODEL_NAME: env.SPLUNK_MODEL_NAME,
    R2_ACCOUNT_ID: env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET: env.R2_BUCKET ?? 'synt-casefiles',
  };
}

export const CONFIG = 'CONFIG';
