import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { AIConnectorService } from '../../services/ai-connector.service';
import { ChatMessage, Conversation, AIProviderConfig } from '../../models/chat.model';
import { ChatMessageComponent } from '../chat-message/chat-message.component';
import { ChatInputComponent } from '../chat-input/chat-input.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { SettingsModalComponent } from '../settings-modal/settings-modal.component';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [
    CommonModule,
    ChatMessageComponent,
    ChatInputComponent,
    SidebarComponent,
    SettingsModalComponent,
  ],
  template: `
    <div class="chat-app">
      <!-- Mobile overlay -->
      <div
        class="mobile-overlay"
        *ngIf="sidebarOpen"
        (click)="sidebarOpen = false"
      ></div>

      <!-- Sidebar -->
      <app-sidebar
        [conversations]="conversations"
        [activeConversationId]="activeConversation?.id || null"
        [isOpen]="sidebarOpen"
        (newChat)="onNewChat()"
        (selectConversation)="onSelectConversation($event)"
        (deleteConversation)="onDeleteConversation($event)"
        (openSettings)="settingsOpen = true"
      ></app-sidebar>

      <!-- Main Chat Area -->
      <main class="chat-main">
        <!-- Header -->
        <header class="chat-header">
          <button class="menu-btn" (click)="sidebarOpen = !sidebarOpen">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>
          <h1>{{ activeConversation?.title || 'AI Chat' }}</h1>
          <div class="header-status">
            <span class="status-dot" [class.configured]="isConfigured"></span>
            <span class="status-text">{{ isConfigured ? 'Connected' : 'Not configured' }}</span>
          </div>
        </header>

        <!-- Messages -->
        <div class="messages-area" #messagesContainer>
          <!-- Welcome screen -->
          <div *ngIf="!activeConversation || activeConversation.messages.length === 0" class="welcome">
            <div class="welcome-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="1.5">
                <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10a10 10 0 0 1-10-10A10 10 0 0 1 12 2z"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </div>
            <h2>How can I help you today?</h2>
            <p>Ask me anything. I'm powered by AI and ready to assist.</p>

            <div *ngIf="!isConfigured" class="setup-prompt">
              <p>To get started, configure your AI provider in
                <button class="link-btn" (click)="settingsOpen = true">Settings</button>.
              </p>
            </div>

            <div class="suggestions" *ngIf="isConfigured">
              <button class="suggestion" (click)="sendSuggestion('Explain how machine learning works in simple terms')">
                Explain machine learning
              </button>
              <button class="suggestion" (click)="sendSuggestion('Write a Python function that checks if a string is a palindrome')">
                Write a palindrome checker
              </button>
              <button class="suggestion" (click)="sendSuggestion('What are the best practices for writing clean code?')">
                Clean code best practices
              </button>
              <button class="suggestion" (click)="sendSuggestion('Help me debug: my API returns 404 but the route exists')">
                Debug a 404 error
              </button>
            </div>
          </div>

          <!-- Chat messages -->
          <div *ngIf="activeConversation && activeConversation.messages.length > 0" class="messages-list">
            <app-chat-message
              *ngFor="let msg of activeConversation.messages; trackBy: trackMessage"
              [message]="msg"
            ></app-chat-message>
          </div>
        </div>

        <!-- Input -->
        <app-chat-input
          [isLoading]="isLoading"
          (messageSent)="onSendMessage($event)"
        ></app-chat-input>
      </main>
    </div>

    <!-- Settings Modal -->
    <app-settings-modal
      [isOpen]="settingsOpen"
      [currentConfig]="aiConfig"
      (close)="settingsOpen = false"
      (saveConfig)="onSaveSettings($event)"
    ></app-settings-modal>
  `,
  styles: [`
    .chat-app {
      display: flex;
      height: 100vh;
      width: 100%;
      background: var(--bg-primary, #fff);
      color: var(--text-primary, #111);
    }

    .mobile-overlay {
      display: none;
    }

    .chat-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .chat-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      border-bottom: 1px solid var(--border-color, #e5e5e5);
      background: var(--bg-primary, #fff);
    }

    .chat-header h1 {
      flex: 1;
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .menu-btn {
      display: none;
      background: none;
      border: none;
      color: var(--text-primary, #333);
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
    }

    .menu-btn:hover {
      background: var(--hover-bg, #f0f0f0);
    }

    .header-status {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #d1d5db;
    }

    .status-dot.configured {
      background: #22c55e;
    }

    .status-text {
      font-size: 12px;
      color: var(--text-muted, #999);
    }

    .messages-area {
      flex: 1;
      overflow-y: auto;
      scroll-behavior: smooth;
    }

    .messages-list {
      max-width: 800px;
      margin: 0 auto;
      width: 100%;
    }

    /* Welcome Screen */
    .welcome {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 40px 20px;
      text-align: center;
    }

    .welcome-icon {
      margin-bottom: 16px;
      opacity: 0.8;
    }

    .welcome h2 {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 8px;
      color: var(--text-primary, #111);
    }

    .welcome > p {
      color: var(--text-muted, #888);
      font-size: 14px;
      margin: 0 0 24px;
    }

    .setup-prompt {
      background: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 13px;
      color: #92400e;
    }

    .setup-prompt p {
      margin: 0;
    }

    .link-btn {
      background: none;
      border: none;
      color: #6366f1;
      text-decoration: underline;
      cursor: pointer;
      font-size: inherit;
      padding: 0;
    }

    .suggestions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      max-width: 500px;
    }

    .suggestion {
      padding: 12px 16px;
      border: 1px solid var(--border-color, #e0e0e0);
      border-radius: 10px;
      background: var(--bg-primary, #fff);
      color: var(--text-primary, #333);
      font-size: 13px;
      text-align: left;
      cursor: pointer;
      transition: all 0.15s;
    }

    .suggestion:hover {
      border-color: #6366f1;
      background: #eef2ff;
    }

    @media (max-width: 768px) {
      .menu-btn {
        display: block;
      }

      .mobile-overlay {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.3);
        z-index: 99;
      }

      .suggestions {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class ChatWindowComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  conversations: Conversation[] = [];
  activeConversation: Conversation | null = null;
  isLoading = false;
  sidebarOpen = false;
  settingsOpen = false;
  isConfigured = false;
  aiConfig!: AIProviderConfig;

  private subscriptions: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    private aiConnector: AIConnectorService
  ) {}

  ngOnInit(): void {
    this.aiConnector.loadConfig();
    this.aiConfig = this.aiConnector.getConfig();
    this.isConfigured = this.aiConnector.isConfigured();

    this.subscriptions.push(
      this.chatService.conversations$.subscribe((convs) => {
        this.conversations = convs;
      }),
      this.chatService.activeConversation$.subscribe((conv) => {
        this.activeConversation = conv;
        setTimeout(() => this.scrollToBottom(), 50);
      }),
      this.chatService.isLoading$.subscribe((loading) => {
        this.isLoading = loading;
        if (loading) {
          this.scrollInterval = setInterval(() => this.scrollToBottom(), 100);
        } else if (this.scrollInterval) {
          clearInterval(this.scrollInterval);
          this.scrollInterval = null;
        }
      })
    );
  }

  private scrollInterval: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
    }
  }

  onNewChat(): void {
    this.chatService.createConversation();
    this.sidebarOpen = false;
  }

  onSelectConversation(id: string): void {
    this.chatService.setActiveConversation(id);
    this.sidebarOpen = false;
  }

  onDeleteConversation(id: string): void {
    this.chatService.deleteConversation(id);
  }

  onSendMessage(content: string): void {
    if (!this.isConfigured) {
      this.settingsOpen = true;
      return;
    }
    this.chatService.sendMessage(content);
  }

  sendSuggestion(text: string): void {
    this.onSendMessage(text);
  }

  onSaveSettings(config: AIProviderConfig): void {
    this.aiConnector.configure(config);
    this.aiConfig = this.aiConnector.getConfig();
    this.isConfigured = this.aiConnector.isConfigured();
  }

  trackMessage(_index: number, msg: ChatMessage): string {
    return msg.id;
  }

  private scrollToBottom(): void {
    const el = this.messagesContainer?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
