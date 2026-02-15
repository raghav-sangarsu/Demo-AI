export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIProviderConfig {
  name: string;
  apiUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
}

export interface AIRequestPayload {
  model: string;
  messages: { role: string; content: string }[];
  max_tokens: number;
  temperature: number;
  stream: boolean;
}

export interface AIResponseChoice {
  message: {
    role: string;
    content: string;
  };
  delta?: {
    content?: string;
  };
  finish_reason: string | null;
}

export interface AIResponse {
  id: string;
  choices: AIResponseChoice[];
}

export const DEFAULT_PROVIDERS: Record<string, Partial<AIProviderConfig>> = {
  openai: {
    name: 'OpenAI',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    maxTokens: 4096,
    temperature: 0.7,
  },
  anthropic: {
    name: 'Anthropic',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
    temperature: 0.7,
  },
  custom: {
    name: 'Custom Provider',
    apiUrl: '',
    model: '',
    maxTokens: 4096,
    temperature: 0.7,
  },
};
