import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIProviderConfig, DEFAULT_PROVIDERS } from '../../models/chat.model';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="close.emit()" *ngIf="isOpen">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>AI Provider Settings</h2>
          <button class="close-btn" (click)="close.emit()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="field">
            <label>Provider</label>
            <div class="provider-grid">
              <button
                *ngFor="let p of providerKeys"
                class="provider-btn"
                [class.active]="selectedProvider === p"
                (click)="selectProvider(p)"
              >
                {{ providers[p].name }}
              </button>
            </div>
          </div>

          <div class="field">
            <label for="apiUrl">API Endpoint</label>
            <input
              id="apiUrl"
              type="url"
              [(ngModel)]="config.apiUrl"
              placeholder="https://api.example.com/v1/chat/completions"
            />
          </div>

          <div class="field">
            <label for="apiKey">API Key</label>
            <div class="key-input-wrapper">
              <input
                id="apiKey"
                [type]="showKey ? 'text' : 'password'"
                [(ngModel)]="config.apiKey"
                placeholder="Enter your API key"
              />
              <button class="toggle-key" (click)="showKey = !showKey">
                {{ showKey ? 'Hide' : 'Show' }}
              </button>
            </div>
          </div>

          <div class="field">
            <label for="model">Model</label>
            <input
              id="model"
              type="text"
              [(ngModel)]="config.model"
              placeholder="e.g., gpt-4o-mini"
            />
          </div>

          <div class="field-row">
            <div class="field">
              <label for="maxTokens">Max Tokens</label>
              <input
                id="maxTokens"
                type="number"
                [(ngModel)]="config.maxTokens"
                min="1"
                max="128000"
              />
            </div>
            <div class="field">
              <label for="temperature">Temperature</label>
              <input
                id="temperature"
                type="number"
                [(ngModel)]="config.temperature"
                min="0"
                max="2"
                step="0.1"
              />
            </div>
          </div>

          <div class="field">
            <label for="systemPrompt">System Prompt</label>
            <textarea
              id="systemPrompt"
              [(ngModel)]="config.systemPrompt"
              rows="3"
              placeholder="Instructions for the AI assistant..."
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button class="cancel-btn" (click)="close.emit()">Cancel</button>
          <button class="save-btn" (click)="save()">Save Settings</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
      animation: fadeIn 0.2s ease;
    }

    .modal {
      background: var(--bg-primary, #fff);
      border-radius: 12px;
      width: 500px;
      max-width: 90vw;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      animation: slideUp 0.3s ease;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color, #e5e5e5);
    }

    .modal-header h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary, #111);
    }

    .close-btn {
      background: none;
      border: none;
      color: var(--text-muted, #999);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
    }

    .close-btn:hover {
      color: var(--text-primary, #111);
      background: var(--hover-bg, #f0f0f0);
    }

    .modal-body {
      padding: 20px;
    }

    .field {
      margin-bottom: 16px;
    }

    .field label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary, #333);
      margin-bottom: 6px;
    }

    .field input,
    .field textarea {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--border-color, #d1d5db);
      border-radius: 8px;
      font-size: 13px;
      background: var(--input-bg, #f9fafb);
      color: var(--text-primary, #111);
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    .field input:focus,
    .field textarea:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
    }

    .field textarea {
      resize: vertical;
      font-family: inherit;
    }

    .provider-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .provider-btn {
      padding: 8px 12px;
      border: 1px solid var(--border-color, #d1d5db);
      border-radius: 8px;
      background: var(--input-bg, #f9fafb);
      color: var(--text-primary, #333);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }

    .provider-btn:hover {
      border-color: #6366f1;
    }

    .provider-btn.active {
      background: #eef2ff;
      border-color: #6366f1;
      color: #6366f1;
    }

    .key-input-wrapper {
      display: flex;
      gap: 8px;
    }

    .key-input-wrapper input {
      flex: 1;
    }

    .toggle-key {
      flex-shrink: 0;
      padding: 8px 12px;
      border: 1px solid var(--border-color, #d1d5db);
      border-radius: 8px;
      background: var(--input-bg, #f9fafb);
      color: var(--text-secondary, #555);
      font-size: 12px;
      cursor: pointer;
    }

    .toggle-key:hover {
      background: var(--hover-bg, #eef2ff);
    }

    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 20px;
      border-top: 1px solid var(--border-color, #e5e5e5);
    }

    .cancel-btn {
      padding: 8px 16px;
      border: 1px solid var(--border-color, #d1d5db);
      border-radius: 8px;
      background: transparent;
      color: var(--text-primary, #333);
      font-size: 13px;
      cursor: pointer;
    }

    .cancel-btn:hover {
      background: var(--hover-bg, #f0f0f0);
    }

    .save-btn {
      padding: 8px 16px;
      border: none;
      border-radius: 8px;
      background: #6366f1;
      color: #fff;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .save-btn:hover {
      background: #4f46e5;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class SettingsModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() currentConfig!: AIProviderConfig;
  @Output() close = new EventEmitter<void>();
  @Output() saveConfig = new EventEmitter<AIProviderConfig>();

  config: AIProviderConfig = {
    name: '',
    apiUrl: '',
    apiKey: '',
    model: '',
    maxTokens: 4096,
    temperature: 0.7,
    systemPrompt: '',
  };

  showKey = false;
  selectedProvider = 'openai';
  providers = DEFAULT_PROVIDERS;
  providerKeys = Object.keys(DEFAULT_PROVIDERS);

  ngOnInit(): void {
    if (this.currentConfig) {
      this.config = { ...this.currentConfig };
      // Detect provider
      if (this.config.apiUrl.includes('anthropic.com')) {
        this.selectedProvider = 'anthropic';
      } else if (this.config.apiUrl.includes('openai.com')) {
        this.selectedProvider = 'openai';
      } else {
        this.selectedProvider = 'custom';
      }
    }
  }

  selectProvider(key: string): void {
    this.selectedProvider = key;
    const provider = this.providers[key];
    this.config = {
      ...this.config,
      name: provider.name || '',
      apiUrl: provider.apiUrl || this.config.apiUrl,
      model: provider.model || this.config.model,
      maxTokens: provider.maxTokens || this.config.maxTokens,
      temperature: provider.temperature ?? this.config.temperature,
    };
  }

  save(): void {
    this.saveConfig.emit({ ...this.config });
    this.close.emit();
  }
}
