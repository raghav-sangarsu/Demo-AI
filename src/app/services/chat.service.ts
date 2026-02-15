import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChatMessage, Conversation } from '../models/chat.model';
import { AIConnectorService } from './ai-connector.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private conversations: Conversation[] = [];
  private activeConversationId: string | null = null;

  conversations$ = new BehaviorSubject<Conversation[]>([]);
  activeConversation$ = new BehaviorSubject<Conversation | null>(null);
  isLoading$ = new BehaviorSubject<boolean>(false);

  constructor(private aiConnector: AIConnectorService) {
    this.loadConversations();
  }

  createConversation(): Conversation {
    const conversation: Conversation = {
      id: this.generateId(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.conversations.unshift(conversation);
    this.setActiveConversation(conversation.id);
    this.saveConversations();
    return conversation;
  }

  setActiveConversation(id: string): void {
    this.activeConversationId = id;
    const conversation = this.conversations.find((c) => c.id === id) || null;
    this.activeConversation$.next(conversation);
    this.conversations$.next([...this.conversations]);
  }

  deleteConversation(id: string): void {
    this.conversations = this.conversations.filter((c) => c.id !== id);
    if (this.activeConversationId === id) {
      if (this.conversations.length > 0) {
        this.setActiveConversation(this.conversations[0].id);
      } else {
        this.activeConversationId = null;
        this.activeConversation$.next(null);
      }
    }
    this.conversations$.next([...this.conversations]);
    this.saveConversations();
  }

  async sendMessage(content: string): Promise<void> {
    let conversation = this.conversations.find((c) => c.id === this.activeConversationId);
    if (!conversation) {
      conversation = this.createConversation();
    }

    const userMessage: ChatMessage = {
      id: this.generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    conversation.messages.push(userMessage);

    // Update title from first user message
    if (conversation.messages.filter((m) => m.role === 'user').length === 1) {
      conversation.title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
    }

    conversation.updatedAt = new Date();
    this.activeConversation$.next({ ...conversation });
    this.conversations$.next([...this.conversations]);
    this.saveConversations();

    // Create assistant placeholder
    const assistantMessage: ChatMessage = {
      id: this.generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    conversation.messages.push(assistantMessage);
    this.activeConversation$.next({ ...conversation });
    this.isLoading$.next(true);

    try {
      await new Promise<void>((resolve, reject) => {
        const stream$ = this.aiConnector.sendMessage(
          conversation!.messages.filter((m) => !m.isStreaming)
        );

        stream$.subscribe({
          next: (chunk: string) => {
            assistantMessage.content += chunk;
            this.activeConversation$.next({ ...conversation! });
          },
          error: (err: any) => {
            assistantMessage.content = `Error: ${err?.message || err || 'Failed to get response'}`;
            assistantMessage.isStreaming = false;
            this.activeConversation$.next({ ...conversation! });
            this.isLoading$.next(false);
            this.saveConversations();
            reject(err);
          },
          complete: () => {
            assistantMessage.isStreaming = false;
            assistantMessage.timestamp = new Date();
            conversation!.updatedAt = new Date();
            this.activeConversation$.next({ ...conversation! });
            this.conversations$.next([...this.conversations]);
            this.isLoading$.next(false);
            this.saveConversations();
            resolve();
          },
        });
      });
    } catch {
      // error already handled in subscribe
    }
  }

  private loadConversations(): void {
    const saved = localStorage.getItem('ai-chat-conversations');
    if (saved) {
      try {
        this.conversations = JSON.parse(saved).map((c: Conversation) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
          messages: c.messages.map((m: ChatMessage) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        }));
        this.conversations$.next([...this.conversations]);
        if (this.conversations.length > 0) {
          this.setActiveConversation(this.conversations[0].id);
        }
      } catch {
        this.conversations = [];
      }
    }
  }

  private saveConversations(): void {
    localStorage.setItem('ai-chat-conversations', JSON.stringify(this.conversations));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  }
}
