import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../../models/chat.model';
import { MarkdownPipe } from '../../pipes/markdown.pipe';

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [CommonModule, MarkdownPipe],
  template: `
    <div class="message" [class.user]="message.role === 'user'" [class.assistant]="message.role === 'assistant'">
      <div class="message-avatar">
        <span class="avatar" [class.user-avatar]="message.role === 'user'" [class.ai-avatar]="message.role === 'assistant'">
          {{ message.role === 'user' ? 'U' : 'AI' }}
        </span>
      </div>
      <div class="message-body">
        <div class="message-header">
          <span class="role-label">{{ message.role === 'user' ? 'You' : 'Assistant' }}</span>
          <span class="timestamp">{{ message.timestamp | date:'shortTime' }}</span>
        </div>
        <div class="message-content" [class.streaming]="message.isStreaming">
          <div *ngIf="message.role === 'assistant'" [innerHTML]="message.content | markdown"></div>
          <div *ngIf="message.role === 'user'" class="user-text">{{ message.content }}</div>
          <span *ngIf="message.isStreaming" class="cursor">&#9608;</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .message {
      display: flex;
      gap: 12px;
      padding: 16px 20px;
      animation: fadeIn 0.3s ease;
    }

    .message.assistant {
      background: var(--msg-assistant-bg, #f7f7f8);
    }

    .message-avatar {
      flex-shrink: 0;
    }

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      color: #fff;
    }

    .user-avatar {
      background: #6366f1;
    }

    .ai-avatar {
      background: #059669;
    }

    .message-body {
      flex: 1;
      min-width: 0;
    }

    .message-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .role-label {
      font-weight: 600;
      font-size: 14px;
      color: var(--text-primary, #111);
    }

    .timestamp {
      font-size: 11px;
      color: var(--text-muted, #999);
    }

    .message-content {
      font-size: 14px;
      line-height: 1.6;
      color: var(--text-primary, #222);
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .message-content ::ng-deep {
      p { margin: 0 0 8px; }
      p:last-child { margin-bottom: 0; }
      pre {
        background: #1e1e2e;
        color: #cdd6f4;
        padding: 12px 16px;
        border-radius: 8px;
        overflow-x: auto;
        font-size: 13px;
        margin: 8px 0;
      }
      code {
        background: #e8e8ec;
        padding: 2px 5px;
        border-radius: 4px;
        font-size: 13px;
      }
      pre code {
        background: none;
        padding: 0;
      }
      ul, ol {
        margin: 4px 0;
        padding-left: 20px;
      }
      blockquote {
        border-left: 3px solid #6366f1;
        margin: 8px 0;
        padding: 4px 12px;
        color: #555;
      }
      table {
        border-collapse: collapse;
        margin: 8px 0;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 6px 12px;
        text-align: left;
      }
      th { background: #f0f0f0; font-weight: 600; }
    }

    .user-text {
      white-space: pre-wrap;
    }

    .cursor {
      animation: blink 1s step-end infinite;
      color: var(--text-primary, #333);
      font-size: 14px;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes blink {
      50% { opacity: 0; }
    }
  `],
})
export class ChatMessageComponent {
  @Input() message!: ChatMessage;
}
