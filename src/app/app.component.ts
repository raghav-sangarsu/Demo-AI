import { Component } from '@angular/core';
import { ChatWindowComponent } from './components/chat-window/chat-window.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ChatWindowComponent],
  template: '<app-chat-window></app-chat-window>',
  styles: [`:host { display: block; height: 100vh; }`],
})
export class AppComponent {}
