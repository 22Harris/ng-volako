# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context

`ng-volako` is the **Angular 21 frontend** of **Volako**, a French double-entry accounting app
(*comptabilité en partie double*, Plan Comptable Général). It is one of two apps in a
dockerized monorepo:

- `../nestjs-volako-api` — NestJS 11 + Prisma 7 + PostgreSQL REST API (clean/hexagonal architecture, 26 modules)
- `ng-volako` — this SPA

The full stack runs via `../docker-compose.yml` (Postgres + API + this app served by Nginx).

## Commands

```bash
npm start          # dev server at http://localhost:4200
npm run build      # production build → dist/
npm run watch      # dev build with watch mode
npm test           # run unit tests once (Vitest via @angular/build:unit-test)
ng generate component features/<name>/<name> --standalone  # scaffold a component
```

The backend API must be running separately at `http://localhost:3000` (see `environment.ts`).

## Money model ⚠️ (read this first)

Amounts are **integers** throughout (DB, API, forms). They are **whole units of the active
currency** — they are **not** divided into centimes for display.

- `SettingsService` holds the active currency (default **`MGA` — Ariary malgache `Ar`**; 11 options
  incl. EUR, USD, XOF…), persisted in `localStorage` under `app_currency`.
- The `cents` pipe formats an integer **as-is** with thousand separators (`.`) plus the currency
  symbol — it does **NOT** divide by 100. Example: `1000 → "1.000 Ar"`, `-1500 → "-1.500 Ar"`.
  (The pipe name is a legacy misnomer; it no longer means "centimes".)

⚠️ **Known inconsistency**: `CurrencyInputComponent` still uses the *old* centimes behaviour
(`writeValue` does `cents / 100`, `onDisplayChange` does `Math.round(val * 100)`). This contradicts
`CentsPipe`, which no longer divides. When editing money input/display, be aware the two disagree;
align them before relying on round-trips.

## Architecture

Angular 21 standalone-component app. Zone-based change detection
(`provideZoneChangeDetection({ eventCoalescing: true })`).

### App bootstrap (`app.config.ts`)

`provideRouter`, `provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))`,
`provideAnimationsAsync()`, `provideNativeDateAdapter()` (Material date pickers),
`provideBrowserGlobalErrorListeners()`, and `provideAppInitializer(() => firstValueFrom(inject(AuthService).initUser()))`
which restores the session from the httpOnly cookie on every page load.

### Routing shell (`app.routes.ts`)

`AppShellComponent` is the layout component for all authenticated routes and is protected by
`authGuard` (`canActivate: [authGuard]`). Auth routes (`/auth/login`, `/auth/register`) live
outside the shell and use `guestGuard`. Most features are **lazy-loaded** (`loadChildren` /
`loadComponent`).

Feature routes under the shell:

| Path | Feature |
|---|---|
| `dashboard` | Tableau de bord |
| `accounts` | Comptes (PCG) |
| `journal` | Écritures / grand livre |
| `operations` | Opérations comptables |
| `journaux` | Journaux (ACHATS/VENTES/BANQUE/CAISSE/OD) |
| `tiers` | Clients / fournisseurs |
| `factures` | Factures + paiements (Factur-X côté API) |
| `rapprochement` | Rapprochement bancaire (import CSV/OFX) |
| `tva` | Déclarations de TVA (CA3) |
| `fiscal-years` | Exercices fiscaux |
| `periode-locks` | Verrouillage de périodes |
| `budget` / `objectifs` / `evenements` | Pilotage (budgets, objectifs, échéances) |
| `rapports` / `stats` | Rapports comptables et statistiques |
| `taux-change` | Taux de change |
| `users` | Gestion des utilisateurs (ADMIN) |
| `audit-log` | Journal d'audit |
| `alertes` / `tutoriels` | Alertes & aide |
| `profile` / `settings` | Profil utilisateur, préférences (devise, société) |

### State / data flow

- No state management library (no NgRx/SignalStore). Data is loaded per-component via services —
  there are **22 services** in `core/services/`, one per domain plus a few cross-cutting ones
  (see "Services overview" below).
- Most services are **stateless** and return plain `Observable`s. The ones that hold **signals**:
  - `AuthService` — `currentUser` signal (the only place the user object lives).
  - `SettingsService` — `currencyCode`/`currency`/`currencySymbol` + company-info signals (§ Money model).
  - `KeyboardShortcutsService` — `helpVisible` signal + a `focusSearch$` `Subject`.
  - `TauxChangeService` — a **signal-based state container** (`state`, `loading`, `error`,
    `sparklinePoints` + derived `computed`s like `rates`, `hasData`). This is the closest thing to
    a local store in the app; mirror it if a feature needs reactive shared state.
- JWT tokens are stored exclusively in **httpOnly cookies** (set by the backend). No token is
  written to `localStorage`. The user object lives only in the `AuthService.currentUser` signal.
  On reload, `AuthService.initUser()` (via `provideAppInitializer`) restores the session by calling
  `GET /auth/me` with the cookie.
- `AuthService` runs a **30-minute inactivity timer** (reset on `mousemove`, `mousedown`,
  `keypress`, `touchstart`, `scroll`); on timeout it logs out. It also exposes `hasRole(...roles)`,
  `login`, `register`, `logout` (calls `POST /auth/logout`), and `clearSession` (local-only clear,
  used by the error interceptor).
- `SettingsService` holds currency + company info (name/siret/adresse), persisted in `localStorage`.

### Services overview (`core/services/`)

One service per domain wraps `environment.apiUrl/<resource>` with typed CRUD over `HttpClient`
(`account`, `journal`, `journal-entry`, `journal`(`journaux`), `operation`, `tiers`, `facture`,
`budget`, `objectif`, `evenement`, `periode-lock`, `rapprochement`, `taux-change`, `tva`,
`fiscal-year`, `audit-log`, `user`). Plus cross-cutting services worth knowing:

| Service | Role |
|---|---|
| `AuthService` | Session (httpOnly cookie), `currentUser` signal, roles, inactivity timer. |
| `SettingsService` | Active currency + company info as signals (§ Money model). |
| `RapportsService` | Accounting reports — balance, grand livre (paginated), bilan, compte de résultat. Exports the report DTOs (`BalanceLine`, `GrandLivreResponse`, `BilanReport`, `CompteResultatReport`). |
| `ExportService` | File exports (§ Exports & FEC). |
| `A11yService` | Screen-reader announcements via CDK `LiveAnnouncer` + programmatic focus (§ Accessibility). |
| `KeyboardShortcutsService` | Global shortcuts, help overlay, `focusSearch$` stream. |

### Exports & FEC (`ExportService`)

`ExportService` produces downloadable files for the reporting screens — **do not re-implement export
logic in components**, call this service.

- **CSV** (`;`-separated, UTF-8 with BOM for Excel-FR): `csvAccounts`, `csvBalance`, `csvGrandLivre`,
  `csvBilan`, `csvResultat`, `csvOperations`, `csvBudget`, `csvObjectifs`, `csvEvenements`.
- **PDF** (`pdfBalance`, `pdfGrandLivre`, …): uses **`jspdf` + `jspdf-autotable`**, both **lazily
  `await import(...)`ed** inside the methods so they stay out of the initial bundle. Keep this lazy.
- **Excel** (`xlsx`) and **FEC** (French *Fichier des Écritures Comptables*): `downloadFec` (`.txt`
  from `GET /rapports/fec`) and `downloadFecExcel`. `xlsx` is also used in `fiscal-years`.

### Accessibility

- `A11yService` (`providedIn: 'root'`) wraps CDK `LiveAnnouncer`: `announce`, `announceSuccess`,
  `announceError`, `announceNavigation`, `announceCount`, and `moveFocus(selector)`. Use it for
  success/error feedback and route changes so non-visual users get parity with toasts.
- `KeyboardShortcutsService` powers `KeyboardShortcutsHelpComponent`; register shortcuts there
  rather than wiring `keydown` per component.

### HTTP layer

Two functional interceptors registered in `app.config.ts`:
- `authInterceptor` — adds `withCredentials: true` only on requests to `environment.apiUrl` (the
  browser sends the httpOnly cookie automatically). External APIs (e.g. frankfurter.app for rates)
  are left untouched to avoid CORS issues.
- `errorInterceptor` — skips `/auth/*` routes (they handle their own errors). On 401, calls
  `POST /auth/refresh` then retries the original request (guarded by an `isRefreshing` flag to avoid
  loops); if refresh fails, calls `auth.clearSession()`. Other errors surface an `AlertService` toast.

### Key shared components (`shared/components/`)

| Component | Purpose |
|---|---|
| `AppShellComponent` | Sidebar layout + `<router-outlet>` |
| `NavbarComponent` | Top/side navigation |
| `AlertComponent` + `AlertService` | Global toast (success / error / info) |
| `ConfirmDialogComponent` | Reusable confirmation dialog |
| `AccountSelectComponent` | `mat-autocomplete` over `AccountService` |
| `CurrencyInputComponent` | Money input via `ControlValueAccessor` (see ⚠️ Money model note) |
| `DateInputComponent` | Wrapped date input |
| `BalanceIndicatorComponent` | Real-time débit/crédit/delta for `JournalEntry` forms |
| `PaginationComponent` | Pager for list views (`PaginatedResponse<T>`) |
| `KeyboardShortcutsHelpComponent` | Shortcuts overlay (see `KeyboardShortcutsService`) |

### OperationFormService

`OperationFormComponent` delegates all `FormArray` construction to `OperationFormService` (provided
locally via `providers: [OperationFormService]`). Nested form shape:

```
operationForm
├── type, date, label
└── entries: FormArray
    └── entryGroup [balancedEntryValidator]
        ├── date, label
        └── lines: FormArray
            └── lineGroup [singleSideValidator]
                ├── accountId, debit, credit
```

Business validators (exported from `operation-form.service.ts`):
- `singleSideValidator` — a line cannot have both debit and credit > 0 (`{ bothSides }`), and cannot
  have both at 0 (`{ emptySide }`).
- `balancedEntryValidator` — ∑ debits = ∑ credits per entry (`{ unbalanced }`).

### Pipes (`shared/pipes/`)

- `cents` (impure) — formats an integer with thousand separators + the active currency symbol from
  `SettingsService`; **does not divide by 100** (`12500 → "12.500 Ar"`). Optional currency arg overrides.
- `operationType` — looks up `OPERATION_TYPE_CONFIG[type].label` (or `.icon`, `.colorClass`).
- `accountCode` — resolves an account id to `"code – name"` given a local accounts array, else `"#id"`.

### Operation types (`core/utils/operation-type.utils.ts`)

Exports `OPERATION_TYPE_CONFIG` (**31 types** across 9 categories), `CATEGORY_LABELS` (plain text
labels, no emoji), and `OPERATION_TYPES_BY_CATEGORY` (pre-grouped for `<mat-optgroup>`, derived by
reducing the config). Do not duplicate this mapping elsewhere.

### Models, guards, utils

- `core/models/` — one interface/enum file per domain (account, auth, operation, journal-entry,
  journal-line, journal, tiers, facture, budget, objectif, evenement, periode-lock, rapprochement,
  taux-change, `paginated`).
- `core/guards/` — `authGuard`, `guestGuard`, `adminGuard` (requires `currentUser().role === 'ADMIN'`).
- `core/utils/` — `operation-type.utils.ts`, `evenement-category.utils.ts`.

## Conventions

- **File naming**: Angular 21 — root app files are `app.ts`, `app.html`, `app.config.ts` (no
  `.component` suffix). Feature components use the `*.component.ts` suffix.
- **Styling**: component styles are mostly inline (`styles: [\`...\`]`). Global utilities, badge
  classes, CSS variables, and Material overrides live in `src/styles.scss`. Prefer existing CSS
  variables (`--clr-primary`, `--clr-page-bg`, …) over hard-coded colours.
- **Material theme**: M3, `mat.$azure-palette` (primary) + `mat.$rose-palette` (tertiary). The
  available palettes do **not** include `indigo` or `pink`.
- **Component style budget**: raised to `8 kB` warning / `16 kB` error in `angular.json`. A ~540 kB
  initial bundle warning is expected with Material.
- **Prettier**: single quotes, print width 100, Angular HTML parser for `*.html`.
- **`provideAnimationsAsync()`** requires `@angular/animations` (installed explicitly).
- **Notable deps**: `@angular/material` + `@angular/cdk` (M3 UI, `LiveAnnouncer`, overlays),
  `jspdf` + `jspdf-autotable` (PDF exports, lazy-imported), `xlsx` (Excel/FEC exports). No state,
  HTTP, or testing-utility libraries beyond Angular's own.

## Testing

Unit tests run on **Vitest** via the `@angular/build:unit-test` builder (`npm test`). Tests use
`TestBed`; HTTP services use `HttpTestingController` (flush is synchronous — no `tick()` needed).

- **Zone testing**: `angular.json` declares `"polyfills": ["zone.js"]` on the **build** target. The
  unit-test builder only auto-adds `zone.js/testing` when `zone.js` is in `polyfills`. Keep it there.
- ⚠️ **Avoid `fakeAsync`/`tick`**: the Vitest runner does not wrap each test in a `ProxyZone`, so
  `fakeAsync` throws *"Expected to be running in 'ProxyZone'"*. Use synchronous `HttpTestingController`
  flushing, real Observables, or Vitest's own `vi.useFakeTimers()` instead.
- Existing specs to mirror: `*.pipe.spec.ts`, `*.service.spec.ts`, `core/guards/guards.spec.ts`,
  `core/interceptors/auth.interceptor.spec.ts`, `operation-form.validators.spec.ts`.

## Mock data

`core/mock/` exists for development without a live API.
