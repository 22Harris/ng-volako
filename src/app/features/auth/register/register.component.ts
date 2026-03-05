import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

export function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pw  = group.get('password')?.value;
  const cpw = group.get('passwordConfirm')?.value;
  return pw === cpw ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
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
            <h2>Commencez à gérer<br>vos finances dès aujourd'hui.</h2>
            <p>Créez votre compte gratuitement et prenez le contrôle de vos finances.</p>
          </div>

          <div class="steps">
            <div class="step">
              <div class="step-num">1</div>
              <div>
                <strong>Créez votre compte</strong>
                <span>En quelques secondes</span>
              </div>
            </div>
            <div class="step-line"></div>
            <div class="step">
              <div class="step-num">2</div>
              <div>
                <strong>Paramétrez vos comptes</strong>
                <span>Plan comptable personnalisé</span>
              </div>
            </div>
            <div class="step-line"></div>
            <div class="step">
              <div class="step-num">3</div>
              <div>
                <strong>Suivez vos finances</strong>
                <span>Dashboard en temps réel</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Illustration pièces / épargne -->
        <div class="brand-illustration" aria-hidden="true">
          <svg viewBox="0 0 320 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Pièces de monnaie empilées -->
            <ellipse cx="80" cy="110" rx="36" ry="10" fill="rgba(253,216,53,.25)"/>
            <rect x="44" y="80" width="72" height="30" rx="4" fill="rgba(253,216,53,.18)"/>
            <ellipse cx="80" cy="80" rx="36" ry="10" fill="rgba(253,216,53,.35)"/>
            <rect x="44" y="55" width="72" height="25" rx="4" fill="rgba(253,216,53,.18)"/>
            <ellipse cx="80" cy="55" rx="36" ry="10" fill="rgba(253,216,53,.5)"/>
            <text x="80" y="59" text-anchor="middle" fill="#fdd835"
              font-size="8" font-family="Roboto,sans-serif" font-weight="700">Ar</text>
            <!-- Flèche croissance -->
            <polyline points="150,120 180,80 210,95 250,40"
              stroke="#69f0ae" stroke-width="3" fill="none"
              stroke-linecap="round" stroke-linejoin="round"/>
            <polygon points="250,40 240,50 258,52" fill="#69f0ae"/>
            <!-- Barres budget -->
            <rect x="160" y="95" width="16" height="25" rx="3" fill="rgba(255,255,255,.15)"/>
            <rect x="183" y="70" width="16" height="50" rx="3" fill="rgba(100,200,255,.3)"/>
            <rect x="206" y="82" width="16" height="38" rx="3" fill="rgba(255,255,255,.15)"/>
            <rect x="229" y="55" width="16" height="65" rx="3" fill="rgba(100,255,180,.3)"/>
            <!-- Labels -->
            <rect x="220" y="22" width="80" height="22" rx="6" fill="rgba(105,240,174,.15)"/>
            <text x="260" y="37" text-anchor="middle" fill="#69f0ae"
              font-size="11" font-family="Roboto,sans-serif" font-weight="700">Épargne +</text>
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
                <rect width="40" height="40" rx="10" fill="#00897b"/>
                <circle cx="20" cy="20" r="10" fill="none" stroke="white" stroke-width="2"/>
                <path d="M20 13v2M20 25v2M13 20h-2M29 20h-2" stroke="white" stroke-width="2" stroke-linecap="round"/>
                <circle cx="20" cy="20" r="3" fill="white"/>
              </svg>
            </div>
            <span class="brand-name">Volako</span>
          </div>

          <h1>Créer un compte</h1>
          <p class="subtitle">Rejoignez Volako et reprenez le contrôle de vos finances</p>

          <div class="trust-row">
            <span class="trust-badge"><mat-icon>lock</mat-icon>SSL sécurisé</span>
            <span class="trust-badge"><mat-icon>verified_user</mat-icon>100% gratuit</span>
            <span class="trust-badge"><mat-icon>bolt</mat-icon>Accès immédiat</span>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="submit()" class="form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nom complet</mat-label>
              <mat-icon matPrefix>person</mat-icon>
              <input matInput formControlName="name" autocomplete="name" placeholder="Jean Dupont"/>
              @if (registerForm.get('name')?.hasError('required') && registerForm.get('name')?.touched) {
                <mat-error>Le nom est requis</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Adresse email</mat-label>
              <mat-icon matPrefix>email</mat-icon>
              <input matInput type="email" formControlName="email"
                autocomplete="email" placeholder="vous@exemple.com"/>
              @if (registerForm.get('email')?.hasError('required') && registerForm.get('email')?.touched) {
                <mat-error>L'email est requis</mat-error>
              }
              @if (registerForm.get('email')?.hasError('email')) {
                <mat-error>Format email invalide</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Mot de passe</mat-label>
              <mat-icon matPrefix>lock</mat-icon>
              <input matInput [type]="hidePassword() ? 'password' : 'text'"
                formControlName="password" autocomplete="new-password"/>
              <button mat-icon-button matSuffix type="button"
                [attr.aria-label]="hidePassword() ? 'Afficher' : 'Masquer'"
                (click)="hidePassword.set(!hidePassword())">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (registerForm.get('password')?.hasError('required') && registerForm.get('password')?.touched) {
                <mat-error>Le mot de passe est requis</mat-error>
              }
              @if (registerForm.get('password')?.hasError('minlength')) {
                <mat-error>Minimum 8 caractères</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirmer le mot de passe</mat-label>
              <mat-icon matPrefix>lock_outline</mat-icon>
              <input matInput [type]="hidePassword() ? 'password' : 'text'"
                formControlName="passwordConfirm" autocomplete="new-password"/>
              @if (registerForm.hasError('passwordMismatch') && registerForm.get('passwordConfirm')?.touched) {
                <mat-error>Les mots de passe ne correspondent pas</mat-error>
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
              [disabled]="registerForm.invalid || loading()">
              @if (loading()) {
                <mat-spinner diameter="22"></mat-spinner>
              } @else {
                <ng-container>
                  <mat-icon>person_add</mat-icon>
                  Créer mon compte
                </ng-container>
              }
            </button>
          </form>

          <div class="divider"><span>Déjà un compte ?</span></div>

          <a routerLink="/auth/login" class="login-link">
            <mat-icon>login</mat-icon>
            Se connecter
          </a>

        </div>

        <!-- Décoration de fond -->
        <div class="bg-deco" aria-hidden="true">
          <svg viewBox="0 0 500 500" fill="none">
            <text x="260" y="370" text-anchor="middle"
              fill="rgba(0,137,123,.025)" font-size="280"
              font-family="Roboto,sans-serif" font-weight="900">Ar</text>
          </svg>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }

    .auth-page { display: flex; height: 100vh; overflow: hidden; }

    /* ── Panneau gauche ── */
    .brand-panel {
      flex: 0 0 42%;
      background: linear-gradient(150deg, #0d1b2a 0%, #0f3460 55%, #00695c 100%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 40px;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute; inset: 0;
        background:
          radial-gradient(ellipse at 25% 25%, rgba(0,137,123,.3) 0%, transparent 55%),
          radial-gradient(ellipse at 75% 75%, rgba(21,101,192,.25) 0%, transparent 55%);
        pointer-events: none;
      }
    }

    .brand-content { position: relative; z-index: 1; }

    .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 40px; }
    .logo-icon { width: 40px; height: 40px; svg { width: 100%; height: 100%; } }
    .logo-text  { font-size: 22px; font-weight: 800; color: white; letter-spacing: -.5px; }

    .brand-hero {
      margin-bottom: 36px;
      h2 { font-size: 24px; font-weight: 800; color: white; line-height: 1.35; margin-bottom: 10px; }
      p  { color: rgba(255,255,255,.6); font-size: 14px; margin: 0; }
    }

    .steps { display: flex; flex-direction: column; gap: 0; }
    .step {
      display: flex; align-items: center; gap: 14px;
      padding: 10px 0;
      strong { display: block; color: white; font-size: 14px; margin-bottom: 2px; }
      span   { color: rgba(255,255,255,.55); font-size: 12px; }
    }
    .step-num {
      width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
      background: rgba(255,255,255,.2);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 13px; font-weight: 700;
    }
    .step-line {
      margin-left: 14px;
      width: 1px; height: 16px;
      background: rgba(255,255,255,.2);
    }

    .brand-illustration { position: relative; z-index: 1; svg { width: 100%; height: auto; } }

    /* ── Panneau droit ── */
    .form-panel {
      flex: 1;
      background: white;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; height: 3px;
        background: linear-gradient(90deg, #00897b 0%, #26a69a 50%, #1565c0 100%);
      }
    }

    .form-content {
      width: 100%; max-width: 460px;
      padding: clamp(16px, 4vh, 48px) 48px;
      position: relative; z-index: 1;
    }

    .form-brand {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 16px;
    }
    .brand-icon { width: 38px; height: 38px; flex-shrink: 0; svg { width: 100%; height: 100%; } }
    .brand-name { font-size: 22px; font-weight: 900; color: #0d1b2a; letter-spacing: -.5px; }

    h1 {
      font-size: 34px; font-weight: 900; color: #0d1b2a;
      margin: 0 0 10px; letter-spacing: -.8px; line-height: 1.1;
    }
    .subtitle { font-size: 15px; color: #546e7a; margin: 0 0 12px; line-height: 1.5; }

    .trust-row { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
    .trust-badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 12px;
      background: #f0faf8; border: 1px solid #b2dfdb;
      border-radius: 20px; font-size: 12px; color: #546e7a; font-weight: 500;
      mat-icon { font-size: 14px; width: 14px; height: 14px; color: #00897b; }
    }

    .form { display: flex; flex-direction: column; gap: 2px; }

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
      background: linear-gradient(135deg, #00897b 0%, #00695c 100%) !important;
      color: white !important; letter-spacing: .4px;
      box-shadow: 0 4px 16px rgba(0,137,123,.35) !important;
      transition: box-shadow .2s, opacity .2s !important;
      &:hover:not([disabled]) { box-shadow: 0 8px 28px rgba(0,137,123,.5) !important; }
      &[disabled] { opacity: .5 !important; box-shadow: none !important; }
    }

    .divider {
      display: flex; align-items: center; gap: 12px;
      margin: 14px 0 10px; color: #b0bec5; font-size: 13px;
      &::before, &::after { content: ''; flex: 1; height: 1px; background: #e8ecf0; }
      span { flex-shrink: 0; white-space: nowrap; }
    }

    .login-link {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 14px 28px;
      border: 2px solid #b2dfdb; border-radius: 14px;
      color: #00897b; text-decoration: none; font-weight: 600; font-size: 15px;
      transition: background .15s, border-color .15s, box-shadow .15s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { background: #f0faf8; border-color: #4db6ac; box-shadow: 0 2px 10px rgba(0,137,123,.12); }
    }

    .bg-deco {
      position: absolute; right: -60px; bottom: -60px;
      width: 450px; height: 450px; pointer-events: none;
      svg { width: 100%; height: 100%; }
    }

    @media (max-width: 768px) { .brand-panel { display: none; } }
    @media (max-width: 480px) { .form-content { padding: 40px 24px; } }
  `]
})
export class RegisterComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  hidePassword = signal(true);
  loading      = signal(false);
  apiError     = signal('');

  registerForm = this.fb.group({
    name:            ['', Validators.required],
    email:           ['', [Validators.required, Validators.email]],
    password:        ['', [Validators.required, Validators.minLength(8)]],
    passwordConfirm: ['', Validators.required],
  }, { validators: passwordMatchValidator });

  submit(): void {
    if (this.registerForm.invalid) return;
    this.loading.set(true);
    this.apiError.set('');
    this.auth.register(this.registerForm.getRawValue() as any).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.apiError.set(err.error?.message ?? "Erreur lors de l'inscription");
        this.loading.set(false);
      }
    });
  }
}
