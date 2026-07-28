import { Component, inject, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { UserService, CreateUserDto, UpdateUserDto } from '../../../core/services/user.service';
import { AlertService } from '../../../shared/components/alert/alert.service';
import { UserProfile, Role } from '../../../core/models/auth.model';

export interface UserFormData {
  user?: UserProfile;
}

const ROLES: { value: Role; label: string }[] = [
  { value: 'ADMIN',          label: 'Administrateur' },
  { value: 'DAF',            label: 'DAF' },
  { value: 'CHEF_COMPTABLE', label: 'Chef comptable' },
  { value: 'COMPTABLE',      label: 'Comptable' },
  { value: 'ASSISTANT',      label: 'Assistant comptable' },
  { value: 'AUDITEUR',       label: 'Auditeur' },
];

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="dlg">
      <div class="dlg-header">
        <div class="dlg-icon">
          <mat-icon>{{ data.user ? 'edit' : 'person_add' }}</mat-icon>
        </div>
        <div class="dlg-titles">
          <div class="dlg-title">{{ data.user ? "Modifier l'utilisateur" : "Nouvel utilisateur" }}</div>
          <div class="dlg-sub">{{ data.user ? data.user.email : "Renseigner les informations" }}</div>
        </div>
        <button class="dlg-close" type="button" (click)="cancel()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dlg-body">
        <form [formGroup]="form" (ngSubmit)="submit()" id="user-form">

          <div class="field-group">
            <label class="field-label">Nom complet <span class="req">*</span></label>
            <div class="field-wrap" [class.has-error]="form.controls.name.invalid && form.controls.name.touched">
              <mat-icon class="fi">person</mat-icon>
              <input class="fi-input" formControlName="name" placeholder="ex: Marie Dupont" autocomplete="off" />
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">Email <span class="req">*</span></label>
            <div class="field-wrap" [class.has-error]="form.controls.email.invalid && form.controls.email.touched">
              <mat-icon class="fi">email</mat-icon>
              <input class="fi-input" formControlName="email" type="email" placeholder="ex: marie@volako.com" autocomplete="off" />
            </div>
          </div>

          @if (!data.user) {
            <div class="field-group">
              <label class="field-label">Mot de passe <span class="req">*</span></label>
              <div class="field-wrap" [class.has-error]="form.controls.password!.invalid && form.controls.password!.touched">
                <mat-icon class="fi">lock</mat-icon>
                <input class="fi-input" formControlName="password" type="password" placeholder="8 caractères minimum" />
              </div>
              @if (form.controls.password!.touched && form.controls.password!.hasError('minlength')) {
                <span class="field-err">8 caractères minimum</span>
              }
            </div>
          }

          <div class="field-group">
            <label class="field-label">Rôle <span class="req">*</span></label>
            <div class="field-wrap" [class.has-error]="form.controls.role.invalid && form.controls.role.touched">
              <mat-icon class="fi">badge</mat-icon>
              <select class="fi-input" formControlName="role">
                <option value="" disabled>Sélectionner un rôle</option>
                @for (r of roles; track r.value) {
                  <option [value]="r.value">{{ r.label }}</option>
                }
              </select>
            </div>
          </div>

        </form>
      </div>

      <div class="dlg-footer">
        <button class="btn-cancel" type="button" (click)="cancel()">Annuler</button>
        <button class="btn-submit" type="submit" form="user-form" [disabled]="saving()">
          <mat-icon>{{ saving() ? 'hourglass_empty' : 'check' }}</mat-icon>
          {{ saving() ? 'Enregistrement…' : (data.user ? 'Modifier' : 'Créer') }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dlg { display: flex; flex-direction: column; width: 480px; max-width: 100%; }

    .dlg-header {
      display: flex; align-items: center; gap: 14px;
      padding: 24px 24px 16px; border-bottom: 1px solid #e2e8f0;
    }
    .dlg-icon {
      width: 44px; height: 44px; border-radius: 12px;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      display: flex; align-items: center; justify-content: center;
      color: #fff; flex-shrink: 0;
    }
    .dlg-titles { flex: 1; min-width: 0; }
    .dlg-title  { font-size: 1rem; font-weight: 600; color: #1e293b; }
    .dlg-sub    { font-size: 0.8rem; color: #94a3b8; margin-top: 2px; }
    .dlg-close  {
      width: 32px; height: 32px; border-radius: 8px; border: none;
      background: #f1f5f9; color: #64748b; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .dlg-close:hover { background: #e2e8f0; }

    .dlg-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }

    .field-group { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 0.8rem; font-weight: 500; color: #475569; }
    .req { color: #ef4444; }
    .field-wrap {
      display: flex; align-items: center; gap: 10px;
      border: 1.5px solid #e2e8f0; border-radius: 10px;
      padding: 0 12px; background: #f8fafc; transition: border-color 0.2s;
    }
    .field-wrap:focus-within { border-color: #3b82f6; background: #fff; }
    .field-wrap.has-error { border-color: #ef4444; }
    .fi { font-size: 18px; width: 18px; height: 18px; color: #94a3b8; flex-shrink: 0; }
    .fi-input {
      flex: 1; border: none; background: transparent; padding: 11px 0;
      font-size: 0.875rem; color: #1e293b; outline: none; font-family: inherit;
    }
    select.fi-input { cursor: pointer; }
    .field-err { font-size: 0.75rem; color: #ef4444; }

    .dlg-footer {
      display: flex; gap: 10px; justify-content: flex-end;
      padding: 16px 24px 20px; border-top: 1px solid #e2e8f0;
    }
    .btn-cancel, .btn-submit {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 9px 20px; border-radius: 10px; font-size: 0.875rem;
      font-weight: 500; cursor: pointer; border: none; font-family: inherit;
      transition: all 0.2s;
    }
    .btn-cancel { background: #f1f5f9; color: #475569; }
    .btn-cancel:hover { background: #e2e8f0; }
    .btn-submit {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: #fff; box-shadow: 0 4px 12px rgba(59,130,246,0.35);
    }
    .btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(59,130,246,0.45); }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-submit mat-icon { font-size: 18px; width: 18px; height: 18px; }
  `]
})
export class UserFormComponent {
  private readonly fb      = inject(FormBuilder);
  private readonly svc     = inject(UserService);
  private readonly alert   = inject(AlertService);
  private readonly dialogRef = inject(MatDialogRef<UserFormComponent>);

  saving = signal(false);
  roles  = ROLES;

  form: FormGroup<{
    name:     FormControl<string | null>;
    email:    FormControl<string | null>;
    password: FormControl<string | null>;
    role:     FormControl<string | null>;
  }>;

  get nameCtrl()     { return this.form.controls.name; }
  get emailCtrl()    { return this.form.controls.email; }
  get passwordCtrl() { return this.form.controls.password; }
  get roleCtrl()     { return this.form.controls.role; }

  constructor(@Inject(MAT_DIALOG_DATA) public data: UserFormData) {
    this.form = this.fb.group({
      name:     [data.user?.name  ?? '', Validators.required],
      email:    [data.user?.email ?? '', [Validators.required, Validators.email]],
      password: [data.user ? null : '', data.user ? [] : [Validators.required, Validators.minLength(8)]],
      role:     [(data.user?.role ?? '') as string, Validators.required],
    });
  }

  cancel(): void { this.dialogRef.close(); }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);

    const val = this.form.getRawValue();

    const obs$ = this.data.user
      ? this.svc.update(this.data.user.id, { name: val.name!, email: val.email!, role: val.role! as Role })
      : this.svc.create({ name: val.name!, email: val.email!, password: val.password!, role: val.role! as Role } as CreateUserDto);

    obs$.subscribe({
      next: user => {
        this.alert.success(this.data.user ? 'Utilisateur modifié' : 'Utilisateur créé');
        this.dialogRef.close(user);
      },
      error: err => {
        this.alert.error(err?.error?.message ?? 'Une erreur est survenue');
        this.saving.set(false);
      },
    });
  }
}
