import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Observable, map, catchError, of, debounceTime, switchMap, first } from 'rxjs';
import { AccountService } from '../../../core/services/account.service';
import { AlertService } from '../../../shared/components/alert/alert.service';
import { Account } from '../../../core/models/account.model';

const CLASS_META = [
  { cls: 1, label: 'Capitaux permanents', bg: '#e3f2fd', fg: '#1565c0' },
  { cls: 2, label: 'Immobilisations',     bg: '#e8f5e9', fg: '#2e7d32' },
  { cls: 3, label: 'Stocks',              bg: '#fff3e0', fg: '#bf360c' },
  { cls: 4, label: 'Tiers',              bg: '#fce4ec', fg: '#880e4f' },
  { cls: 5, label: 'Financiers',          bg: '#e0f7fa', fg: '#006064' },
  { cls: 6, label: 'Charges',             bg: '#fde8e8', fg: '#b71c1c' },
  { cls: 7, label: 'Produits',            bg: '#e8f5e9', fg: '#1b5e20' },
  { cls: 8, label: 'Résultats',           bg: '#f3e5f5', fg: '#4a148c' },
];

@Component({
  selector: 'app-account-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="dlg">

      <!-- ── Header ── -->
      <div class="dlg-header">
        <div class="dlg-icon">
          <mat-icon>{{ data.account ? 'edit' : 'add_circle' }}</mat-icon>
        </div>
        <div class="dlg-titles">
          <div class="dlg-title">{{ data.account ? 'Modifier le compte' : 'Nouveau compte' }}</div>
          <div class="dlg-sub">
            {{ data.account ? (data.account.code + ' — ' + data.account.name) : 'Renseigner les informations du compte' }}
          </div>
        </div>
        <button class="dlg-close" type="button" (click)="cancel()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- ── Body ── -->
      <div class="dlg-body">
        <form [formGroup]="form" (ngSubmit)="submit()" id="acc-form">

          <!-- Code -->
          <div class="field-group">
            <label class="field-label">Code <span class="req">*</span></label>
            <div class="field-wrap"
              [class.has-error]="codeCtrl.invalid && codeCtrl.touched"
              [class.is-loading]="codeCtrl.pending">
              <mat-icon class="fi">tag</mat-icon>
              <input class="fi-input" formControlName="code" placeholder="ex: 512" type="text" autocomplete="off" />
              @if (codeCtrl.pending) { <span class="spin"></span> }
            </div>
            @if (codeCtrl.touched && codeCtrl.hasError('required')) {
              <span class="field-err">Le code est requis</span>
            } @else if (codeCtrl.touched && codeCtrl.hasError('codeTaken')) {
              <span class="field-err">Ce code est déjà utilisé</span>
            } @else if (codeCtrl.pending) {
              <span class="field-hint">Vérification en cours…</span>
            }
          </div>

          <!-- Nom -->
          <div class="field-group">
            <label class="field-label">Nom <span class="req">*</span></label>
            <div class="field-wrap" [class.has-error]="nameCtrl.invalid && nameCtrl.touched">
              <mat-icon class="fi">label_outline</mat-icon>
              <input class="fi-input" formControlName="name" placeholder="ex: Banque" type="text" autocomplete="off" />
            </div>
            @if (nameCtrl.touched && nameCtrl.hasError('required')) {
              <span class="field-err">Le nom est requis</span>
            }
          </div>

          <!-- Classe -->
          <div class="field-group">
            <label class="field-label">Classe <span class="req">*</span></label>
            <div class="class-grid">
              @for (meta of classMeta; track meta.cls) {
                <button type="button" class="cls-tile"
                  [class.selected]="form.get('class')?.value === meta.cls"
                  [style.--fg]="meta.fg"
                  [style.--bg]="meta.bg"
                  (click)="form.get('class')?.setValue(meta.cls); form.get('class')?.markAsTouched()">
                  <span class="cls-num">{{ meta.cls }}</span>
                  <span class="cls-lbl">{{ meta.label }}</span>
                </button>
              }
            </div>
            @if (form.get('class')?.touched && form.get('class')?.hasError('required')) {
              <span class="field-err">La classe est requise</span>
            }
          </div>

        </form>
      </div>

      <!-- ── Footer ── -->
      <div class="dlg-footer">
        <button class="btn-cancel" type="button" (click)="cancel()">Annuler</button>
        <button class="btn-save" type="submit" form="acc-form"
          [disabled]="form.invalid || form.pending || saving()">
          @if (saving()) {
            <span class="btn-spin"></span>
          } @else {
            <mat-icon>check</mat-icon>
          }
          Enregistrer
        </button>
      </div>

    </div>
  `,
  styles: [`
    .dlg {
      display: flex; flex-direction: column;
      width: 500px; max-width: 95vw;
      background: white;
    }

    /* ── Header ── */
    .dlg-header {
      display: flex; align-items: center; gap: 14px;
      padding: 20px 24px 16px;
      border-bottom: 1px solid #f0f4f8;
    }
    .dlg-icon {
      width: 46px; height: 46px; border-radius: 13px; flex-shrink: 0;
      background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
      display: flex; align-items: center; justify-content: center;
      color: white; box-shadow: 0 4px 12px rgba(21,101,192,.35);
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }
    .dlg-titles { flex: 1; min-width: 0; }
    .dlg-title { font-size: 16px; font-weight: 800; color: #0d1b2a; }
    .dlg-sub   { font-size: 12px; color: #90a4ae; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .dlg-close {
      flex-shrink: 0; width: 32px; height: 32px; border-radius: 8px;
      border: 1.5px solid #e8edf2; background: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #90a4ae; transition: border-color .15s, color .15s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { border-color: #cfd8dc; color: #546e7a; }
    }

    /* ── Body ── */
    .dlg-body {
      padding: 22px 24px; display: flex; flex-direction: column; gap: 20px;
    }

    .field-group { display: flex; flex-direction: column; gap: 6px; }
    .field-label {
      font-size: 11px; font-weight: 700; color: #475569;
      text-transform: uppercase; letter-spacing: .5px;
    }
    .req { color: #ef5350; }

    .field-wrap {
      display: flex; align-items: center; gap: 8px;
      height: 44px; padding: 0 12px;
      border: 1.5px solid #e2e8f0; border-radius: 10px; background: #f8fafc;
      transition: border-color .15s, background .15s;
      &:focus-within { border-color: #90caf9; background: white; box-shadow: 0 0 0 3px rgba(144,202,249,.15); }
      &.has-error { border-color: #ef9a9a; background: #fff5f5; }
      &.is-loading { border-color: #90caf9; }
    }
    .fi { font-size: 16px; width: 16px; height: 16px; color: #94a3b8; flex-shrink: 0; }
    .fi-input {
      flex: 1; border: none; background: transparent; outline: none;
      font-size: 14px; color: #0d1b2a; min-width: 0;
      &::placeholder { color: #b0bec5; }
    }

    .field-err  { font-size: 12px; color: #c62828; }
    .field-hint { font-size: 12px; color: #78909c; }

    .spin {
      width: 16px; height: 16px; flex-shrink: 0; border-radius: 50%;
      border: 2px solid #dde6f0; border-top-color: #1565c0;
      animation: spin .6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Class grid ── */
    .class-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
    }
    .cls-tile {
      display: flex; flex-direction: column; align-items: center; gap: 5px;
      padding: 10px 6px 8px; border-radius: 12px; cursor: pointer;
      border: 1.5px solid #e2e8f0; background: white;
      transition: border-color .12s, background .12s, transform .1s, box-shadow .12s;
      &:hover {
        border-color: var(--fg); background: var(--bg);
        transform: translateY(-1px);
        box-shadow: 0 3px 10px rgba(0,0,0,.08);
      }
      &.selected {
        border-color: var(--fg) !important; background: var(--bg) !important;
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--fg) 18%, transparent);
      }
    }
    .cls-num {
      width: 28px; height: 28px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 800;
      background: var(--bg); color: var(--fg);
      .selected & { filter: brightness(.9); }
    }
    .cls-lbl {
      font-size: 9px; color: #78909c; text-align: center; line-height: 1.3;
      max-width: 64px;
      .selected & { color: var(--fg); font-weight: 600; }
    }

    /* ── Footer ── */
    .dlg-footer {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 14px 24px 20px;
      border-top: 1px solid #f0f4f8;
    }
    .btn-cancel {
      height: 40px; padding: 0 18px; border-radius: 10px; cursor: pointer;
      border: 1.5px solid #e2e8f0; background: white;
      font-size: 14px; font-weight: 600; color: #546e7a;
      transition: background .12s, border-color .12s;
      &:hover { background: #f5f7fa; border-color: #cfd8dc; }
    }
    .btn-save {
      display: flex; align-items: center; gap: 6px;
      height: 40px; padding: 0 20px; border-radius: 10px; cursor: pointer; border: none;
      background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
      color: white; font-size: 14px; font-weight: 700;
      box-shadow: 0 4px 14px rgba(21,101,192,.4);
      transition: box-shadow .2s, transform .15s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover:not(:disabled) { box-shadow: 0 6px 20px rgba(21,101,192,.55); transform: translateY(-1px); }
      &:disabled { opacity: .5; cursor: not-allowed; transform: none; box-shadow: none; }
    }
    .btn-spin {
      width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0;
      border: 2px solid rgba(255,255,255,.4); border-top-color: white;
      animation: spin .6s linear infinite;
    }
  `]
})
export class AccountFormComponent implements OnInit {
  private readonly fb             = inject(FormBuilder);
  private readonly accountService = inject(AccountService);
  private readonly alertService   = inject(AlertService);
  private readonly dialogRef      = inject(MatDialogRef<AccountFormComponent>);
  readonly data: { account?: Account } = inject(MAT_DIALOG_DATA) ?? {};

  saving    = signal(false);
  classMeta = CLASS_META;

  get codeCtrl() { return this.form.get('code')!; }
  get nameCtrl() { return this.form.get('name')!; }

  form = this.fb.group({
    code:  ['', { validators: [Validators.required], asyncValidators: [this.uniqueCodeValidator()], updateOn: 'blur' }],
    name:  ['', Validators.required],
    class: [null as number | null, Validators.required],
  });

  ngOnInit(): void {
    if (this.data.account) {
      this.form.patchValue({
        code:  this.data.account.code,
        name:  this.data.account.name,
        class: this.data.account.class,
      });
    }
  }

  cancel(): void { this.dialogRef.close(false); }

  submit(): void {
    if (this.form.invalid || this.form.pending) return;
    this.saving.set(true);
    const dto = this.form.getRawValue() as { code: string; name: string; class: number };

    const request$ = this.data.account
      ? this.accountService.update(this.data.account.id, dto)
      : this.accountService.create(dto);

    request$.subscribe({
      next: () => {
        this.alertService.success(this.data.account ? 'Compte modifié' : 'Compte créé');
        this.dialogRef.close(true);
      },
      error: () => {
        this.alertService.error('Erreur lors de l\'enregistrement');
        this.saving.set(false);
      }
    });
  }

  private uniqueCodeValidator(): AsyncValidatorFn {
    return (ctrl: AbstractControl): Observable<ValidationErrors | null> => {
      if (!ctrl.value) return of(null);
      return of(ctrl.value).pipe(
        debounceTime(400),
        switchMap(code =>
          this.accountService.checkCode(code).pipe(
            map(accounts => {
              const taken = accounts.some(a => a.id !== this.data.account?.id);
              return taken ? { codeTaken: true } : null;
            }),
            catchError(() => of(null))
          )
        ),
        first()
      );
    };
  }
}
