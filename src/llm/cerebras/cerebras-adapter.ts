import { OpenAiCompatibleAdapter } from '../openai-compatible/openai-compatible-adapter';

const CEREBRAS_FREE_TIER = { requestsPerDay: 14400, tokensPerDay: 1000000 };

export class CerebrasAdapter extends OpenAiCompatibleAdapter {
  constructor() {
    super('cerebras', 'https://api.cerebras.ai/v1', true);
  }

  getFreeTier() {
    return CEREBRAS_FREE_TIER;
  }
}
