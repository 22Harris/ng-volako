import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule, MatIconModule, MatListModule],
  template: `
    <mat-toolbar color="primary" class="toolbar">
      <button mat-icon-button (click)="menuToggle.emit()">
        <mat-icon>menu</mat-icon>
      </button>
      <span class="app-title">Volako</span>
      <span class="spacer"></span>
      @if (authService.currentUser()) {
        <span class="user-name">{{ authService.currentUser()?.name }}</span>
      }
      <button mat-icon-button (click)="authService.logout()" title="Déconnexion">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>
  `,
  styles: [`
    .toolbar { position: fixed; top: 0; left: 0; right: 0; z-index: 100; }
    .spacer { flex: 1; }
    .app-title { font-weight: 700; font-size: 18px; margin-left: 8px; }
    .user-name { font-size: 14px; margin-right: 8px; opacity: .85; }
  `]
})
export class NavbarComponent {
  @Output() menuToggle = new EventEmitter<void>();
  authService = inject(AuthService);
}
