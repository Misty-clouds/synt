import { makeHostedModel } from './hosted-model';
import { makeMcpSplunkClient } from './mcp-splunk';
import { makeMockHostedModel } from './mock-model';
import { makeMockSplunkClient } from './mock-splunk';
import type { HostedModel, SplunkClient, SplunkEnv } from './types';

export * from './types';
export { makeMcpSplunkClient } from './mcp-splunk';
export { makeMockSplunkClient } from './mock-splunk';
export { makeHostedModel } from './hosted-model';
export { makeMockHostedModel } from './mock-model';

function useMock(env: SplunkEnv): boolean {
  return env.USE_MOCK_SPLUNK === 'true' || !env.SPLUNK_MCP_URL;
}

/** Pick the real MCP client or the in-memory mock based on env. */
export function makeSplunkClient(env: SplunkEnv): SplunkClient {
  return useMock(env) ? makeMockSplunkClient() : makeMcpSplunkClient(env);
}

/** Pick the real hosted model or the deterministic mock based on env. */
export function makeHostedModelClient(env: SplunkEnv): HostedModel {
  const mock = env.USE_MOCK_SPLUNK === 'true' || !env.SPLUNK_MODEL_ENDPOINT;
  return mock ? makeMockHostedModel() : makeHostedModel(env);
}
