import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { AlertService } from '../../shared/components/alert/alert.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <div class="page">

      <!-- ── Hero Banner ── -->
      <div class="hero">
        <div class="hero-bg"></div>
        <div class="hero-content">
          <div class="avatar">{{ initials() }}</div>
          <div class="hero-info">
            <h1 class="hero-name">{{ auth.currentUser()?.name || 'Utilisateur' }}</h1>
            <div class="hero-meta">
              <span class="role-pill">
                <mat-icon>shield</mat-icon>
                {{ auth.currentUser()?.role }}
              </span>
              <span class="hero-email">
                <mat-icon>mail</mat-icon>
                {{ auth.currentUser()?.email }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Cards grid ── -->
      <div class="cards-grid">

        <!-- Informations personnelles -->
        <div class="card">
          <div class="card-header">
            <div class="card-icon card-icon--blue">
              <mat-icon>person</mat-icon>
            </div>
            <div>
              <h2 class="card-title">Informations personnelles</h2>
              <p class="card-sub">Mettez à jour votre nom et votre adresse e-mail</p>
            </div>
          </div>

          <div class="card-body">
            <div class="field">
              <label class="field-label">
                <mat-icon>badge</mat-icon> Rôle
              </label>
              <div class="role-display">
                <mat-icon class="role-icon">shield</mat-icon>
                <span>{{ auth.currentUser()?.role }}</span>
              </div>
            </div>

            <div class="field">
              <label class="field-label" for="name">
                <mat-icon>person_outline</mat-icon> Nom complet
              </label>
              <div class="input-wrap">
                <mat-icon class="input-icon">person_outline</mat-icon>
                <input id="name" type="text" [(ngModel)]="name" class="input-field"
                  placeholder="Votre nom complet" />
              </div>
            </div>

            <div class="field">
              <label class="field-label" for="email">
                <mat-icon>mail_outline</mat-icon> Adresse e-mail
              </label>
              <div class="input-wrap">
                <mat-icon class="input-icon">mail_outline</mat-icon>
                <input id="email" type="email" [(ngModel)]="email" class="input-field"
                  placeholder="votre@email.com" />
              </div>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn-primary" (click)="saveProfile()" [disabled]="saving()">
              @if (saving()) { <mat-icon class="spin">refresh</mat-icon> Enregistrement… }
              @else { <mat-icon>save</mat-icon> Enregistrer les modifications }
            </button>
          </div>
        </div>

        <!-- Changer le mot de passe -->
        <div class="card">
          <div class="card-header">
            <div class="card-icon card-icon--amber">
              <mat-icon>lock</mat-icon>
            </div>
            <div>
              <h2 class="card-title">Sécurité du compte</h2>
              <p class="card-sub">Modifiez votre mot de passe régulièrement</p>
            </div>
          </div>

          <div class="card-body">
            <div class="field">
              <label class="field-label" for="cur-pwd">
                <mat-icon>lock_outline</mat-icon> Mot de passe actuel
              </label>
              <div class="input-wrap">
                <mat-icon class="input-icon">lock_outline</mat-icon>
                <input id="cur-pwd" [type]="showCurrent ? 'text' : 'password'"
                  [(ngModel)]="currentPassword" class="input-field"
                  placeholder="••••••••" autocomplete="current-password" />
                <button class="toggle-pwd" type="button" (click)="showCurrent = !showCurrent"
                  [matTooltip]="showCurrent ? 'Masquer' : 'Afficher'">
                  <mat-icon>{{ showCurrent ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
            </div>

            <div class="field">
              <label class="field-label" for="new-pwd">
                <mat-icon>lock_reset</mat-icon> Nouveau mot de passe
              </label>
              <div class="input-wrap">
                <mat-icon class="input-icon">lock_reset</mat-icon>
                <input id="new-pwd" [type]="showNew ? 'text' : 'password'"
                  [(ngModel)]="newPassword" class="input-field"
                  placeholder="••••••••" autocomplete="new-password" />
                <button class="toggle-pwd" type="button" (click)="showNew = !showNew"
                  [matTooltip]="showNew ? 'Masquer' : 'Afficher'">
                  <mat-icon>{{ showNew ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
              @if (newPassword.length > 0) {
                <div class="strength-wrap">
                  <div class="strength-bars">
                    @for (i of [1,2,3,4]; track i) {
                      <div class="strength-bar" [class.active]="passwordStrength() >= i"
                        [class]="'strength-bar strength-bar--' + strengthColor()"></div>
                    }
                  </div>
                  <span class="strength-label" [class]="'strength-label--' + strengthColor()">
                    {{ strengthLabel() }}
                  </span>
                </div>
              }
            </div>

            <div class="field">
              <label class="field-label" for="confirm-pwd">
                <mat-icon>check_circle_outline</mat-icon> Confirmer le nouveau mot de passe
              </label>
              <div class="input-wrap" [class.input-wrap--match]="confirmPassword && newPassword === confirmPassword"
                [class.input-wrap--mismatch]="confirmPassword && newPassword !== confirmPassword">
                <mat-icon class="input-icon">check_circle_outline</mat-icon>
                <input id="confirm-pwd" [type]="showConfirm ? 'text' : 'password'"
                  [(ngModel)]="confirmPassword" class="input-field"
                  placeholder="••••••••" autocomplete="new-password" />
                <button class="toggle-pwd" type="button" (click)="showConfirm = !showConfirm"
                  [matTooltip]="showConfirm ? 'Masquer' : 'Afficher'">
                  <mat-icon>{{ showConfirm ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (confirmPassword) {
                  <mat-icon class="match-icon">
                    {{ newPassword === confirmPassword ? 'check_circle' : 'cancel' }}
                  </mat-icon>
                }
              </div>
            </div>

            @if (passwordError()) {
              <div class="error-banner">
                <mat-icon>error_outline</mat-icon>
                {{ passwordError() }}
              </div>
            }
          </div>

          <div class="card-footer">
            <button class="btn-primary btn-amber" (click)="changePassword()" [disabled]="saving()">
              @if (saving()) { <mat-icon class="spin">refresh</mat-icon> Modification… }
              @else { <mat-icon>key</mat-icon> Changer le mot de passe }
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page { padding: 28px 32px; }

    /* ── Hero ── */
    .hero {
      position: relative; border-radius: 20px; margin-bottom: 28px;
      overflow: hidden; padding: 36px 36px 32px;
      background: var(--clr-card-bg); border: 1px solid var(--clr-border);
      box-shadow: var(--shadow-card);
    }
    .hero-bg {
      position: absolute; inset: 0;
      background: linear-gradient(135deg, var(--clr-primary) 0%, var(--clr-primary-dark) 50%, #1a237e 100%);
      opacity: .07;
      pointer-events: none;
    }
    .hero-content { display: flex; align-items: center; gap: 24px; position: relative; }
    .avatar {
      width: 80px; height: 80px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, var(--clr-primary), var(--clr-primary-dark));
      display: flex; align-items: center; justify-content: center;
      font-size: 1.75rem; font-weight: 700; color: #fff; letter-spacing: 1px;
      box-shadow: 0 6px 20px rgba(21,101,192,.35);
    }
    .hero-name {
      margin: 0 0 10px; font-size: 1.6rem; font-weight: 700;
      color: var(--clr-text-primary);
    }
    .hero-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .role-pill {
      display: inline-flex; align-items: center; gap: 5px;
      background: var(--clr-primary); color: #fff;
      padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .hero-email {
      display: inline-flex; align-items: center; gap: 5px;
      color: var(--clr-text-secondary); font-size: 0.85rem;
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
    }

    /* ── Grid ── */
    .cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

    /* ── Card ── */
    .card {
      background: var(--clr-card-bg); border: 1px solid var(--clr-border);
      border-radius: var(--radius-card); box-shadow: var(--shadow-card);
      display: flex; flex-direction: column; overflow: hidden;
      transition: box-shadow .2s;
      &:hover { box-shadow: var(--shadow-card-hover); }
    }
    .card-header {
      display: flex; align-items: center; gap: 14px;
      padding: 20px 24px; border-bottom: 1px solid var(--clr-border);
      background: #fafbfc;
    }
    .card-icon {
      width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 22px; width: 22px; height: 22px; color: #fff; }
    }
    .card-icon--blue  { background: linear-gradient(135deg, var(--clr-primary), var(--clr-primary-dark)); box-shadow: 0 4px 10px rgba(21,101,192,.3); }
    .card-icon--amber { background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 4px 10px rgba(245,158,11,.3); }
    .card-title { margin: 0 0 2px; font-size: 0.95rem; font-weight: 600; color: var(--clr-text-primary); }
    .card-sub { margin: 0; font-size: 0.75rem; color: var(--clr-text-secondary); }

    .card-body { padding: 20px 24px; flex: 1; display: flex; flex-direction: column; gap: 16px; }
    .card-footer { padding: 16px 24px; border-top: 1px solid var(--clr-border); background: #fafbfc; }

    /* ── Fields ── */
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field-label {
      display: flex; align-items: center; gap: 5px;
      font-size: 0.78rem; font-weight: 600; color: var(--clr-text-secondary);
      text-transform: uppercase; letter-spacing: .04em;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .role-display {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 14px; border-radius: 8px;
      background: var(--clr-primary-light); color: var(--clr-primary);
      font-weight: 600; font-size: 0.875rem;
    }
    .role-icon { font-size: 18px; width: 18px; height: 18px; }

    /* ── Input ── */
    .input-wrap {
      position: relative; display: flex; align-items: center;
      border: 1.5px solid var(--clr-border); border-radius: 10px;
      background: var(--clr-card-bg); transition: border-color .2s, box-shadow .2s;
      &:focus-within {
        border-color: var(--clr-primary);
        box-shadow: 0 0 0 3px rgba(21,101,192,.1);
      }
      &.input-wrap--match  { border-color: var(--clr-positive); box-shadow: 0 0 0 3px rgba(46,125,50,.1); }
      &.input-wrap--mismatch { border-color: var(--clr-negative); box-shadow: 0 0 0 3px rgba(198,40,40,.1); }
    }
    .input-icon {
      position: absolute; left: 12px; font-size: 18px; width: 18px; height: 18px;
      color: var(--clr-text-secondary); pointer-events: none;
    }
    .input-field {
      width: 100%; padding: 10px 12px 10px 40px; border: none; background: transparent;
      color: var(--clr-text-primary); font-size: 0.875rem; outline: none; border-radius: 10px;
      &::placeholder { color: #b0bec5; }
    }
    .toggle-pwd {
      background: none; border: none; cursor: pointer; padding: 0 10px;
      display: flex; align-items: center; color: var(--clr-text-secondary);
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { color: var(--clr-primary); }
    }
    .match-icon {
      margin-right: 10px; font-size: 18px !important; width: 18px !important; height: 18px !important;
      color: var(--clr-positive);
      .input-wrap--mismatch & { color: var(--clr-negative); }
    }

    /* ── Password strength ── */
    .strength-wrap { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
    .strength-bars { display: flex; gap: 4px; flex: 1; }
    .strength-bar {
      height: 4px; flex: 1; border-radius: 99px; background: var(--clr-border);
      transition: background .3s;
      &.active.strength-bar--red    { background: var(--clr-negative); }
      &.active.strength-bar--orange { background: var(--clr-warn); }
      &.active.strength-bar--green  { background: var(--clr-positive); }
    }
    .strength-label { font-size: 0.72rem; font-weight: 600; white-space: nowrap; }
    .strength-label--red    { color: var(--clr-negative); }
    .strength-label--orange { color: var(--clr-warn); }
    .strength-label--green  { color: var(--clr-positive); }

    /* ── Error banner ── */
    .error-banner {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px; border-radius: 8px;
      background: var(--clr-negative-bg); color: var(--clr-negative);
      font-size: 0.82rem; font-weight: 500;
      mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
    }

    /* ── Buttons ── */
    .btn-primary {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 22px; border-radius: 10px; border: none; cursor: pointer;
      background: var(--clr-primary); color: #fff; font-size: 0.875rem; font-weight: 500;
      transition: all .2s; width: 100%; justify-content: center;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover:not(:disabled) { background: var(--clr-primary-dark); box-shadow: 0 4px 12px rgba(21,101,192,.35); }
      &:disabled { opacity: 0.55; cursor: not-allowed; }
    }
    .btn-amber {
      background: #f59e0b;
      &:hover:not(:disabled) { background: #d97706; box-shadow: 0 4px 12px rgba(245,158,11,.35); }
    }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spin { animation: spin .8s linear infinite; }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .page { padding: 16px; }
      .cards-grid { grid-template-columns: 1fr; }
      .hero { padding: 24px; }
      .avatar { width: 60px; height: 60px; font-size: 1.4rem; }
      .hero-name { font-size: 1.3rem; }
    }
  `]
})
export class ProfileComponent implements OnInit {
  readonly auth          = inject(AuthService);
  private readonly alert = inject(AlertService);
  private readonly http  = inject(HttpClient);

  saving          = signal(false);
  passwordError   = signal('');
  name            = '';
  email           = '';
  currentPassword = '';
  newPassword     = '';
  confirmPassword = '';
  showCurrent     = false;
  showNew         = false;
  showConfirm     = false;

  initials = computed(() => {
    const n = this.auth.currentUser()?.name ?? '';
    return n.split(' ').map(w => w[0] ?? '').slice(0, 2).join('').toUpperCase() || '?';
  });

  passwordStrength = computed(() => {
    const p = this.newPassword;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8)  score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/\d/.test(p) && /[^A-Za-z\d]/.test(p)) score++;
    return Math.max(1, score);
  });

  strengthColor = computed(() => {
    const s = this.passwordStrength();
    if (s <= 1) return 'red';
    if (s <= 2) return 'orange';
    return 'green';
  });

  strengthLabel = computed(() => {
    const s = this.passwordStrength();
    if (s <= 1) return 'Faible';
    if (s === 2) return 'Moyen';
    if (s === 3) return 'Fort';
    return 'Très fort';
  });

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) { this.name = user.name; this.email = user.email; }
  }

  saveProfile(): void {
    if (!this.name.trim() || !this.email.trim()) {
      this.alert.error('Nom et email sont obligatoires'); return;
    }
    this.saving.set(true);
    this.http.patch<{ id: number; name: string; email: string }>(`${environment.apiUrl}/auth/profile`, {
      name: this.name.trim(),
      email: this.email.trim(),
    }).subscribe({
      next: updated => {
        const user = this.auth.currentUser();
        if (user) {
          const updated2 = { ...user, name: updated.name, email: updated.email };
          localStorage.setItem('auth_user', JSON.stringify(updated2));
          this.auth.currentUser.set(updated2);
        }
        this.alert.success('Profil mis à jour');
        this.saving.set(false);
      },
      error: err => { this.alert.error(err?.error?.message ?? 'Erreur'); this.saving.set(false); },
    });
  }

  changePassword(): void {
    this.passwordError.set('');
    if (!this.currentPassword || !this.newPassword) {
      this.passwordError.set('Tous les champs sont obligatoires'); return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError.set('Les mots de passe ne correspondent pas'); return;
    }
    if (this.newPassword.length < 8) {
      this.passwordError.set('Le nouveau mot de passe doit contenir au moins 8 caractères'); return;
    }
    this.saving.set(true);
    this.http.post(`${environment.apiUrl}/auth/change-password`, {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
    }).subscribe({
      next: () => {
        this.alert.success('Mot de passe changé avec succès');
        this.currentPassword = '';
        this.newPassword     = '';
        this.confirmPassword = '';
        this.saving.set(false);
      },
      error: err => { this.alert.error(err?.error?.message ?? 'Erreur'); this.saving.set(false); },
    });
  }
}
