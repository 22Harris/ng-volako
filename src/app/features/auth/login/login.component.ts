import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-page">

      <!-- ── Panneau gauche (branding) ── -->
      <div class="brand-panel">
        <div class="brand-content">
          <div class="logo">
            <div class="logo-icon">
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="10" fill="rgba(255,255,255,0.15)"/>
                <circle cx="20" cy="20" r="10" fill="none" stroke="white" stroke-width="2"/>
                <path d="M20 13v2M20 25v2M13 20h-2M29 20h-2" stroke="white" stroke-width="2" stroke-linecap="round"/>
                <circle cx="20" cy="20" r="3" fill="white"/>
              </svg>
            </div>
            <span class="logo-text">Volako</span>
          </div>

          <div class="brand-hero">
            <h2>Votre comptabilité<br>personnelle, simplifiée.</h2>
            <p>Gérez vos comptes, opérations et journal en toute clarté.</p>
          </div>

          <ul class="features">
            <li>
              <div class="feat-icon">
                <svg viewBox="0 0 20 20" fill="white"><path d="M3 10l7-7 7 7v8H6v-5H3v5H1v-8z"/></svg>
              </div>
              <span>Comptes en partie double</span>
            </li>
            <li>
              <div class="feat-icon">
                <svg viewBox="0 0 20 20" fill="white"><path d="M3 3h14v2H3zm0 4h14v2H3zm0 4h8v2H3zm0 4h5v2H3z"/></svg>
              </div>
              <span>Grand livre &amp; journal</span>
            </li>
            <li>
              <div class="feat-icon">
                <svg viewBox="0 0 20 20" fill="white"><path d="M1 19L7 8l5 7 4-5 3 9H1z"/></svg>
              </div>
              <span>Tableau de bord financier</span>
            </li>
          </ul>
        </div>

        <!-- Illustration SVG graphique financier -->
        <div class="brand-illustration" aria-hidden="true">
          <svg viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="150" x2="320" y2="150" stroke="rgba(255,255,255,.07)" stroke-width="1"/>
            <line x1="0" y1="110" x2="320" y2="110" stroke="rgba(255,255,255,.07)" stroke-width="1"/>
            <line x1="0" y1="70"  x2="320" y2="70"  stroke="rgba(255,255,255,.07)" stroke-width="1"/>
            <line x1="0" y1="30"  x2="320" y2="30"  stroke="rgba(255,255,255,.07)" stroke-width="1"/>
            <rect x="20"  y="90"  width="28" height="60" rx="5" fill="rgba(255,255,255,.12)"/>
            <rect x="65"  y="65"  width="28" height="85" rx="5" fill="rgba(255,255,255,.12)"/>
            <rect x="110" y="45"  width="28" height="105" rx="5" fill="rgba(100,180,255,.3)"/>
            <rect x="155" y="75"  width="28" height="75"  rx="5" fill="rgba(255,255,255,.12)"/>
            <rect x="200" y="35"  width="28" height="115" rx="5" fill="rgba(100,255,180,.3)"/>
            <rect x="245" y="55"  width="28" height="95"  rx="5" fill="rgba(255,255,255,.12)"/>
            <polyline points="34,70 79,50 124,30 169,45 214,20 259,38"
              stroke="#fdd835" stroke-width="2.5" fill="none"
              stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="34"  cy="70" r="4" fill="#fdd835"/>
            <circle cx="79"  cy="50" r="4" fill="#fdd835"/>
            <circle cx="124" cy="30" r="4" fill="#fdd835"/>
            <circle cx="169" cy="45" r="4" fill="#fdd835"/>
            <circle cx="214" cy="20" r="4" fill="#fdd835"/>
            <circle cx="259" cy="38" r="4" fill="#fdd835"/>
            <rect x="225" y="5" width="68" height="22" rx="6" fill="rgba(253,216,53,.2)"/>
            <text x="259" y="20" text-anchor="middle" fill="#fdd835"
              font-size="11" font-family="Roboto,sans-serif" font-weight="700">+18.4 %</text>
          </svg>
        </div>
      </div>

      <!-- ── Panneau droit (formulaire plein) ── -->
      <div class="form-panel">

        <div class="form-content">

          <!-- Marque -->
          <div class="form-brand">
            <div class="brand-icon">
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="10" fill="#1565c0"/>
                <circle cx="20" cy="20" r="10" fill="none" stroke="white" stroke-width="2"/>
                <path d="M20 13v2M20 25v2M13 20h-2M29 20h-2" stroke="white" stroke-width="2" stroke-linecap="round"/>
                <circle cx="20" cy="20" r="3" fill="white"/>
              </svg>
            </div>
            <span class="brand-name">Volako</span>
          </div>

          <h1>Bon retour&nbsp;!</h1>
          <p class="subtitle">Connectez-vous à votre espace comptable</p>

          <div class="trust-row">
            <span class="trust-badge"><mat-icon>lock</mat-icon>SSL sécurisé</span>
            <span class="trust-badge"><mat-icon>verified_user</mat-icon>Données chiffrées</span>
            <span class="trust-badge"><mat-icon>cloud_done</mat-icon>Sauvegarde auto</span>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="submit()" class="form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Adresse email</mat-label>
              <mat-icon matPrefix>email</mat-icon>
              <input matInput type="email" formControlName="email"
                autocomplete="email" placeholder="vous@exemple.com"/>
              @if (loginForm.get('email')?.hasError('required') && loginForm.get('email')?.touched) {
                <mat-error>L'email est requis</mat-error>
              }
              @if (loginForm.get('email')?.hasError('email')) {
                <mat-error>Format email invalide</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Mot de passe</mat-label>
              <mat-icon matPrefix>lock</mat-icon>
              <input matInput [type]="hidePassword() ? 'password' : 'text'"
                formControlName="password" autocomplete="current-password"/>
              <button mat-icon-button matSuffix type="button"
                [attr.aria-label]="hidePassword() ? 'Afficher' : 'Masquer'"
                (click)="hidePassword.set(!hidePassword())">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (loginForm.get('password')?.hasError('required') && loginForm.get('password')?.touched) {
                <mat-error>Le mot de passe est requis</mat-error>
              }
              @if (loginForm.get('password')?.hasError('minlength')) {
                <mat-error>Minimum 6 caractères</mat-error>
              }
            </mat-form-field>

            @if (apiError()) {
              <div class="api-error" role="alert">
                <mat-icon>error_outline</mat-icon>
                <span>{{ apiError() }}</span>
              </div>
            }

            <button mat-flat-button type="submit"
              class="submit-btn full-width"
              [disabled]="loginForm.invalid || loading()">
              @if (loading()) {
                <mat-spinner diameter="22"></mat-spinner>
              } @else {
                <ng-container>
                  <mat-icon>login</mat-icon>
                  Se connecter
                </ng-container>
              }
            </button>
          </form>

          <div class="divider"><span>Pas encore de compte ?</span></div>

          <a routerLink="/auth/register" class="register-link">
            <mat-icon>person_add</mat-icon>
            Créer un compte gratuitement
          </a>

        </div>

        <!-- Décoration de fond -->
        <div class="bg-deco" aria-hidden="true">
          <svg viewBox="0 0 500 500" fill="none">
            <text x="260" y="370" text-anchor="middle"
              fill="rgba(21,101,192,.028)" font-size="280"
              font-family="Roboto,sans-serif" font-weight="900">Ar</text>
          </svg>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }

    .auth-page {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    /* ── Panneau gauche ── */
    .brand-panel {
      flex: 0 0 42%;
      background: linear-gradient(150deg, #0d1b2a 0%, #0f3460 60%, #1565c0 100%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 40px;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
          radial-gradient(ellipse at 20% 20%, rgba(21,101,192,.35) 0%, transparent 55%),
          radial-gradient(ellipse at 80% 80%, rgba(0,137,123,.2) 0%, transparent 55%);
        pointer-events: none;
      }
    }

    .brand-content { position: relative; z-index: 1; }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 48px;
    }
    .logo-icon { width: 40px; height: 40px; svg { width: 100%; height: 100%; } }
    .logo-text  { font-size: 22px; font-weight: 800; color: white; letter-spacing: -.5px; }

    .brand-hero {
      margin-bottom: 40px;
      h2 { font-size: 26px; font-weight: 800; color: white; line-height: 1.35; margin-bottom: 10px; }
      p  { color: rgba(255,255,255,.6); font-size: 15px; margin: 0; }
    }

    .features {
      list-style: none; padding: 0; margin: 0;
      display: flex; flex-direction: column; gap: 14px;
      li {
        display: flex; align-items: center; gap: 12px;
        color: rgba(255,255,255,.82); font-size: 14px;
      }
    }
    .feat-icon {
      width: 32px; height: 32px; flex-shrink: 0;
      background: rgba(255,255,255,.12); border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      svg { width: 15px; height: 15px; }
    }

    .brand-illustration {
      position: relative; z-index: 1;
      svg { width: 100%; height: auto; }
    }

    /* ── Panneau droit ── */
    .form-panel {
      flex: 1;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; height: 3px;
        background: linear-gradient(90deg, #1565c0 0%, #42a5f5 50%, #00897b 100%);
      }
    }

    .form-content {
      width: 100%; max-width: 460px;
      padding: clamp(24px, 5vh, 64px) 48px;
      position: relative; z-index: 1;
    }

    .form-brand {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 24px;
    }
    .brand-icon { width: 38px; height: 38px; flex-shrink: 0; svg { width: 100%; height: 100%; } }
    .brand-name { font-size: 22px; font-weight: 900; color: #0d1b2a; letter-spacing: -.5px; }

    h1 {
      font-size: 36px; font-weight: 900; color: #0d1b2a;
      margin: 0 0 10px; letter-spacing: -.8px; line-height: 1.1;
    }
    .subtitle { font-size: 16px; color: #546e7a; margin: 0 0 16px; line-height: 1.5; }

    .trust-row {
      display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap;
    }
    .trust-badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 12px;
      background: #f0f4f8; border: 1px solid #dde6f0;
      border-radius: 20px; font-size: 12px; color: #546e7a; font-weight: 500;
      mat-icon { font-size: 14px; width: 14px; height: 14px; color: #1565c0; }
    }

    .form { display: flex; flex-direction: column; gap: 6px; }

    .api-error {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px;
      background: #fde8e8; border-left: 3px solid #c62828;
      border-radius: 10px; color: #c62828; font-size: 13px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .submit-btn {
      height: 54px; font-size: 16px; font-weight: 700;
      border-radius: 14px !important; margin-top: 12px;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%) !important;
      color: white !important; letter-spacing: .4px;
      box-shadow: 0 4px 16px rgba(21,101,192,.35) !important;
      transition: box-shadow .2s, opacity .2s !important;
      &:hover:not([disabled]) { box-shadow: 0 8px 28px rgba(21,101,192,.5) !important; }
      &[disabled] { opacity: .5 !important; box-shadow: none !important; }
    }

    .divider {
      display: flex; align-items: center; gap: 12px;
      margin: 18px 0 12px; color: #b0bec5; font-size: 13px;
      &::before, &::after { content: ''; flex: 1; height: 1px; background: #e8ecf0; }
      span { flex-shrink: 0; white-space: nowrap; }
    }

    .register-link {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 14px 28px;
      border: 2px solid #dde6f0; border-radius: 14px;
      color: #1565c0; text-decoration: none; font-weight: 600; font-size: 15px;
      transition: background .15s, border-color .15s, box-shadow .15s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { background: #f0f4f8; border-color: #90caf9; box-shadow: 0 2px 10px rgba(21,101,192,.12); }
    }

    .bg-deco {
      position: absolute; right: -60px; bottom: -60px;
      width: 450px; height: 450px; pointer-events: none;
      svg { width: 100%; height: 100%; }
    }

    @media (max-width: 768px) { .brand-panel { display: none; } }
    @media (max-width: 480px) { .form-content { padding: 48px 24px; } }
  `]
})
export class LoginComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  hidePassword = signal(true);
  loading      = signal(false);
  apiError     = signal('');

  loginForm = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    if (this.loginForm.invalid) return;
    this.loading.set(true);
    this.apiError.set('');
    this.auth.login(this.loginForm.getRawValue() as any).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.apiError.set(err.error?.message ?? 'Identifiants invalides');
        this.loading.set(false);
      }
    });
  }
}
