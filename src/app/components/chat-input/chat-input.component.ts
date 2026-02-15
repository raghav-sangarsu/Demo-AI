import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="input-container">
      <div class="input-wrapper">
        <textarea
          #inputField
          [(ngModel)]="inputText"
          (keydown)="onKeyDown($event)"
          placeholder="Send a message..."
          [disabled]="isLoading"
          rows="1"
          (input)="autoResize($event)"
        ></textarea>
        <button
          class="send-btn"
          (click)="send()"
          [disabled]="!inputText.trim() || isLoading"
          [class.active]="inputText.trim() && !isLoading"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>
      <div class="input-footer">
        <span class="hint">Press <kbd>Enter</kbd> to send, <kbd>Shift+Enter</kbd> for new line</span>
      </div>
    </div>
  `,
  styles: [`
    .input-container {
      padding: 12px 20px 16px;
      background: var(--bg-primary, #fff);
      border-top: 1px solid var(--border-color, #e5e5e5);
    }

    .input-wrapper {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      background: var(--input-bg, #f4f4f5);
      border: 1px solid var(--border-color, #e0e0e0);
      border-radius: 12px;
      padding: 8px 12px;
      transition: border-color 0.2s;
    }

    .input-wrapper:focus-within {
      border-color: #6366f1;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
    }

    textarea {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      resize: none;
      font-size: 14px;
      line-height: 1.5;
      max-height: 150px;
      color: var(--text-primary, #111);
      font-family: inherit;
      padding: 4px 0;
    }

    textarea::placeholder {
      color: var(--text-muted, #999);
    }

    textarea:disabled {
      opacity: 0.6;
    }

    .send-btn {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      background: #d1d5db;
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .send-btn.active {
      background: #6366f1;
    }

    .send-btn.active:hover {
      background: #4f46e5;
    }

    .send-btn:disabled {
      cursor: not-allowed;
    }

    .input-footer {
      text-align: center;
      margin-top: 6px;
    }

    .hint {
      font-size: 11px;
      color: var(--text-muted, #aaa);
    }

    kbd {
      background: var(--kbd-bg, #e8e8ec);
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 10px;
      font-family: inherit;
    }
  `],
})
export class ChatInputComponent {
  @Input() isLoading = false;
  @Output() messageSent = new EventEmitter<string>();

  inputText = '';

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  send(): void {
    const text = this.inputText.trim();
    if (text && !this.isLoading) {
      this.messageSent.emit(text);
      this.inputText = '';
      // Reset textarea height
      const textarea = document.querySelector('textarea');
      if (textarea) textarea.style.height = 'auto';
    }
  }

  autoResize(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
  }
}
