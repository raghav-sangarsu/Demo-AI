import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conversation } from '../../models/chat.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="sidebar" [class.open]="isOpen">
      <div class="sidebar-header">
        <h2>Chats</h2>
        <button class="new-chat-btn" (click)="newChat.emit()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          New Chat
        </button>
      </div>

      <div class="conversation-list">
        <div
          *ngFor="let conv of conversations"
          class="conversation-item"
          [class.active]="conv.id === activeConversationId"
          (click)="selectConversation.emit(conv.id)"
        >
          <div class="conv-info">
            <span class="conv-title">{{ conv.title }}</span>
            <span class="conv-date">{{ conv.updatedAt | date:'shortDate' }}</span>
          </div>
          <button
            class="delete-btn"
            (click)="onDelete($event, conv.id)"
            title="Delete conversation"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        </div>

        <div *ngIf="conversations.length === 0" class="empty-state">
          <p>No conversations yet</p>
          <p class="hint">Start a new chat to begin</p>
        </div>
      </div>

      <div class="sidebar-footer">
        <button class="settings-btn" (click)="openSettings.emit()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
          Settings
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 280px;
      height: 100%;
      background: var(--sidebar-bg, #f9fafb);
      border-right: 1px solid var(--border-color, #e5e5e5);
      display: flex;
      flex-direction: column;
      transition: transform 0.3s ease;
    }

    .sidebar-header {
      padding: 16px;
      border-bottom: 1px solid var(--border-color, #e5e5e5);
    }

    .sidebar-header h2 {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary, #111);
      margin: 0 0 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .new-chat-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 12px;
      border: 1px dashed var(--border-color, #d1d5db);
      border-radius: 8px;
      background: transparent;
      color: var(--text-primary, #374151);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .new-chat-btn:hover {
      background: var(--hover-bg, #eef2ff);
      border-color: #6366f1;
      color: #6366f1;
    }

    .conversation-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .conversation-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;
      margin-bottom: 2px;
    }

    .conversation-item:hover {
      background: var(--hover-bg, #eef2ff);
    }

    .conversation-item.active {
      background: var(--active-bg, #e0e7ff);
    }

    .conv-info {
      flex: 1;
      min-width: 0;
    }

    .conv-title {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary, #111);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .conv-date {
      font-size: 11px;
      color: var(--text-muted, #999);
    }

    .delete-btn {
      flex-shrink: 0;
      background: none;
      border: none;
      color: var(--text-muted, #999);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      opacity: 0;
      transition: all 0.15s;
    }

    .conversation-item:hover .delete-btn {
      opacity: 1;
    }

    .delete-btn:hover {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-muted, #999);
    }

    .empty-state p {
      margin: 0;
      font-size: 13px;
    }

    .empty-state .hint {
      font-size: 12px;
      margin-top: 4px;
    }

    .sidebar-footer {
      padding: 12px 16px;
      border-top: 1px solid var(--border-color, #e5e5e5);
    }

    .settings-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: var(--text-secondary, #555);
      font-size: 13px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .settings-btn:hover {
      background: var(--hover-bg, #eef2ff);
    }

    @media (max-width: 768px) {
      .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 100;
        transform: translateX(-100%);
        box-shadow: 2px 0 8px rgba(0,0,0,0.1);
      }
      .sidebar.open {
        transform: translateX(0);
      }
    }
  `],
})
export class SidebarComponent {
  @Input() conversations: Conversation[] = [];
  @Input() activeConversationId: string | null = null;
  @Input() isOpen = true;

  @Output() newChat = new EventEmitter<void>();
  @Output() selectConversation = new EventEmitter<string>();
  @Output() deleteConversation = new EventEmitter<string>();
  @Output() openSettings = new EventEmitter<void>();

  onDelete(event: Event, id: string): void {
    event.stopPropagation();
    this.deleteConversation.emit(id);
  }
}
