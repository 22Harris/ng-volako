# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # dev server at http://localhost:4200
npm run build      # production build → dist/
npm run watch      # dev build with watch mode
npm test           # run unit tests with Vitest
ng generate component features/<name>/<name>/<name> --standalone  # scaffold a component
```

The backend API (NestJS) must be running separately at `http://localhost:3000`.

## Architecture

Angular 21 standalone-component app. All money values are stored and transmitted as **integer centimes** (e.g. 12500 = 125.00 €).

### Routing shell

`app.routes.ts` uses `AppShellComponent` as a layout wrapper for authenticated routes. The `authGuard` is currently commented out (`// canActivate: [authGuard]`) — re-enable when auth is stable. Auth routes (`/auth/login`, `/auth/register`) are outside the shell and use `guestGuard`.

### State / data flow

- No state management library. Data is loaded per-component via services.
- `AuthService` exposes `currentUser` as a **signal**; other services return plain Observables.
- JWT is stored in `localStorage` under `access_token` / `auth_user`.

### HTTP layer

Two functional interceptors registered in `app.config.ts`:
- `authInterceptor` — injects `Bearer <token>` on every request
- `errorInterceptor` — handles 401 (auto-logout) and shows `AlertService` toasts for other errors

### Key shared components

| Component | Purpose |
|---|---|
| `AppShellComponent` | Dark sidebar (240px / 64px collapsed) + `<router-outlet>` |
| `AlertComponent` + `AlertService` | Global toast (success / error / info, 4 s) |
| `ConfirmDialogComponent` | Reusable delete confirmation |
| `AccountSelectComponent` | `mat-autocomplete` backed by `AccountService.getAll()` |
| `CurrencyInputComponent` | Displays euros, stores centimes via `ControlValueAccessor` |
| `BalanceIndicatorComponent` | Real-time débit/crédit/delta display for `JournalEntry` forms |

### OperationFormService

`OperationFormComponent` delegates all `FormArray` construction to `OperationFormService` (injected locally via `providers: [OperationFormService]`). The nested form shape is:

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

Business validators: `singleSideValidator` (a line cannot have both debit and credit > 0) and `balancedEntryValidator` (∑ debits = ∑ credits per entry).

### Pipes

- `cents` — converts integer centimes to formatted string (`12500 → "125.00 €"`)
- `operationType` — looks up `OPERATION_TYPE_CONFIG[type].label` (or `.icon`, `.colorClass`)
- `accountCode` — resolves an account id to `"code – name"` given a local accounts array

### Operation types

`core/utils/operation-type.utils.ts` exports `OPERATION_TYPE_CONFIG` (30 types), `CATEGORY_LABELS`, and `OPERATION_TYPES_BY_CATEGORY` (pre-grouped for `<mat-optgroup>`). Do not duplicate this mapping elsewhere.

## Conventions

- **File naming**: Angular 21 convention — root app files are `app.ts`, `app.html`, `app.scss` (no `.component` suffix). Feature components use the standard `*.component.ts` suffix.
- **Styling**: Component styles are inline (`styles: [\`...\`]`). Global utilities, badge classes, CSS variables, and Material overrides live in `src/styles.scss`. Use existing CSS variables (`--clr-primary`, `--clr-page-bg`, etc.) rather than hard-coding colours.
- **Material theme**: M3, `mat.$azure-palette` (primary) + `mat.$rose-palette` (tertiary). Available palettes do **not** include `indigo` or `pink`.
- **Component style budget**: raised to `8 kB` warning / `16 kB` error in `angular.json` (complex inline styles). A ~540 kB initial bundle warning is expected with Material.
- **Prettier**: single quotes, print width 100, Angular HTML parser for `*.html`.
- **Mock data**: `core/mock/mock-data.ts` exists for development without a live API.
- **`provideAnimationsAsync()`** requires `@angular/animations` (installed explicitly; not bundled with Material).
