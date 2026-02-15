import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { AIProviderConfig, AIRequestPayload, ChatMessage } from '../models/chat.model';

@Injectable({
  providedIn: 'root',
})
export class AIConnectorService {
  private config: AIProviderConfig = {
    name: 'OpenAI',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    model: 'gpt-4o-mini',
    maxTokens: 4096,
    temperature: 0.7,
    systemPrompt: 'You are a helpful AI assistant. Respond clearly and concisely.',
  };

  configure(config: Partial<AIProviderConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfig();
  }

  getConfig(): AIProviderConfig {
    return { ...this.config };
  }

  isConfigured(): boolean {
    return !!this.config.apiKey && !!this.config.apiUrl;
  }

  loadConfig(): void {
    const saved = localStorage.getItem('ai-chat-config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.config = { ...this.config, ...parsed };
      } catch {
        // use defaults
      }
    }
  }

  private saveConfig(): void {
    localStorage.setItem('ai-chat-config', JSON.stringify(this.config));
  }

  sendMessage(messages: ChatMessage[]): Observable<string> {
    const subject = new Subject<string>();

    const apiMessages = this.buildApiMessages(messages);
    this.streamResponse(apiMessages, subject);

    return subject.asObservable();
  }

  private buildApiMessages(messages: ChatMessage[]): { role: string; content: string }[] {
    const apiMessages: { role: string; content: string }[] = [];

    if (this.config.systemPrompt) {
      apiMessages.push({ role: 'system', content: this.config.systemPrompt });
    }

    for (const msg of messages) {
      if (msg.role !== 'system') {
        apiMessages.push({ role: msg.role, content: msg.content });
      }
    }

    return apiMessages;
  }

  private async streamResponse(
    apiMessages: { role: string; content: string }[],
    subject: Subject<string>
  ): Promise<void> {
    const isAnthropic = this.config.apiUrl.includes('anthropic.com');

    try {
      if (isAnthropic) {
        await this.streamAnthropic(apiMessages, subject);
      } else {
        await this.streamOpenAICompatible(apiMessages, subject);
      }
    } catch (error: any) {
      subject.error(error?.message || 'Failed to connect to AI provider');
    }
  }

  private async streamOpenAICompatible(
    apiMessages: { role: string; content: string }[],
    subject: Subject<string>
  ): Promise<void> {
    const payload: AIRequestPayload = {
      model: this.config.model,
      messages: apiMessages,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      stream: true,
    };

    const response = await fetch(this.config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API error ${response.status}: ${errorBody}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response stream available');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          subject.complete();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            subject.next(content);
          }
        } catch {
          // skip malformed chunks
        }
      }
    }

    subject.complete();
  }

  private async streamAnthropic(
    apiMessages: { role: string; content: string }[],
    subject: Subject<string>
  ): Promise<void> {
    const systemMsg = apiMessages.find((m) => m.role === 'system');
    const nonSystemMessages = apiMessages.filter((m) => m.role !== 'system');

    const payload: Record<string, unknown> = {
      model: this.config.model,
      messages: nonSystemMessages,
      max_tokens: this.config.maxTokens,
      stream: true,
    };

    if (systemMsg) {
      payload['system'] = systemMsg.content;
    }

    const response = await fetch(this.config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API error ${response.status}: ${errorBody}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response stream available');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            subject.next(parsed.delta.text);
          }
          if (parsed.type === 'message_stop') {
            subject.complete();
            return;
          }
        } catch {
          // skip malformed chunks
        }
      }
    }

    subject.complete();
  }
}
