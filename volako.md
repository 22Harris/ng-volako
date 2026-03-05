 
# Spécifications Frontend Angular — Gestion Financière (Comptabilité)

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture du projet](#2-architecture-du-projet)
3. [Authentification](#3-authentification)
4. [Modèles TypeScript](#4-modèles-typescript)
5. [Services HTTP](#5-services-http)
6. [Routing](#6-routing)
7. [Composants par feature](#7-composants-par-feature)
8. [Composants partagés](#8-composants-partagés)
9. [Intercepteurs HTTP](#9-intercepteurs-http)
10. [Guards](#10-guards)
11. [Pipes utilitaires](#11-pipes-utilitaires)
12. [Utilitaires OperationType](#12-utilitaires-operationtype)
13. [Résumé CRUD](#13-résumé-crud)

---

## 1. Vue d'ensemble

L'application Angular consomme une API NestJS REST. Elle permet de gérer les **Comptes**, les **Écritures de journal** et les **Opérations**, en respectant les règles de la **partie double** (∑ débits = ∑ crédits). L'accès est protégé par un système d'authentification JWT.

**Stack technique :**
- Angular 17+ (standalone components, signals)
- Angular Material (UI)
- ReactiveFormsModule
- HttpClient + interceptors
- JWT via `localStorage`

---

## 2. Architecture du projet

```
src/
├── app/
│   ├── core/
│   │   ├── models/                  # Interfaces & enums TypeScript
│   │   │   ├── auth.model.ts
│   │   │   ├── account.model.ts
│   │   │   ├── journal-entry.model.ts
│   │   │   ├── journal-line.model.ts
│   │   │   └── operation.model.ts
│   │   ├── services/                # Services injectables (root)
│   │   │   ├── auth.service.ts
│   │   │   ├── account.service.ts
│   │   │   ├── journal-entry.service.ts
│   │   │   └── operation.service.ts
│   │   ├── interceptors/
│   │   │   ├── auth.interceptor.ts  # Injection du Bearer token
│   │   │   └── error.interceptor.ts # Gestion globale des erreurs
│   │   ├── guards/
│   │   │   ├── auth.guard.ts        # Protège les routes privées
│   │   │   └── guest.guard.ts       # Redirige si déjà connecté
│   │   └── utils/
│   │       └── operation-type.utils.ts
│   ├── shared/
│   │   ├── components/
│   │   │   ├── confirm-dialog/
│   │   │   ├── alert/
│   │   │   ├── account-select/
│   │   │   ├── currency-input/
│   │   │   └── balance-indicator/
│   │   └── pipes/
│   │       ├── cents.pipe.ts
│   │       ├── operation-type.pipe.ts
│   │       └── account-code.pipe.ts
│   ├── features/
│   │   ├── auth/                    # Login / Register
│   │   ├── dashboard/               # Tableau de bord
│   │   ├── accounts/                # Gestion des comptes
│   │   ├── journal/                 # Grand livre / écritures
│   │   └── operations/              # Opérations comptables
│   ├── app.routes.ts
│   └── app.config.ts
└── environments/
    ├── environment.ts
    └── environment.prod.ts
```

---

## 3. Authentification

### 3.1 Modèle

```typescript
// core/models/auth.model.ts

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
}
```

### 3.2 AuthService

```typescript
// core/services/auth.service.ts

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly USER_KEY  = 'auth_user';

  currentUser = signal<User | null>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  login(dto: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, dto).pipe(
      tap(res => this.persist(res))
    );
  }

  register(dto: RegisterDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, dto).pipe(
      tap(res => this.persist(res))
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private persist(res: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.access_token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
```

### 3.3 Composants Auth

#### `LoginComponent`

- Route : `/auth/login`
- Champs : `email` (requis, format email), `password` (requis, min 6 caractères)
- Bouton "Se connecter"
- Lien vers `/auth/register`
- Redirection vers `/dashboard` après succès
- Affichage des erreurs API (identifiants invalides, etc.)

**FormGroup :**
```typescript
loginForm = this.fb.group({
  email:    ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(6)]],
});
```

#### `RegisterComponent`

- Route : `/auth/register`
- Champs : `name` (requis), `email` (requis, format email), `password` (requis, min 8 caractères), `passwordConfirm` (requis)
- Validator cross-field : `password === passwordConfirm`
- Lien vers `/auth/login`
- Redirection vers `/dashboard` après succès

**Validator cross-field :**
```typescript
export function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pw  = group.get('password')?.value;
  const cpw = group.get('passwordConfirm')?.value;
  return pw === cpw ? null : { passwordMismatch: true };
}
```

### 3.4 Routes Auth

```typescript
// features/auth/auth.routes.ts
export const authRoutes: Routes = [
  { path: 'login',    component: LoginComponent,    canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  { path: '',         redirectTo: 'login', pathMatch: 'full' },
];
```

---

## 4. Modèles TypeScript

### 4.1 OperationType

```typescript
// core/models/operation.model.ts

export enum OperationType {
  /* EXPLOITATION */
  PURCHASE             = 'PURCHASE',
  SALE                 = 'SALE',
  SERVICE_EXPENSE      = 'SERVICE_EXPENSE',
  SERVICE_INCOME       = 'SERVICE_INCOME',
  /* FINANCIÈRES */
  PAYMENT              = 'PAYMENT',
  RECEIPT              = 'RECEIPT',
  TRANSFER             = 'TRANSFER',
  BANK_DEPOSIT         = 'BANK_DEPOSIT',
  BANK_WITHDRAWAL      = 'BANK_WITHDRAWAL',
  /* PRÊTS & DETTES */
  LOAN_GIVEN           = 'LOAN_GIVEN',
  LOAN_RECEIVED        = 'LOAN_RECEIVED',
  LOAN_REPAYMENT       = 'LOAN_REPAYMENT',
  DEBT_PAYMENT         = 'DEBT_PAYMENT',
  /* DONS & SUBVENTIONS */
  DONATION_GIVEN       = 'DONATION_GIVEN',
  DONATION_RECEIVED    = 'DONATION_RECEIVED',
  SUBSIDY_RECEIVED     = 'SUBSIDY_RECEIVED',
  /* INVESTISSEMENTS */
  ASSET_PURCHASE       = 'ASSET_PURCHASE',
  ASSET_SALE           = 'ASSET_SALE',
  DEPRECIATION         = 'DEPRECIATION',
  /* SALAIRES & SOCIAL */
  SALARY_PAYMENT       = 'SALARY_PAYMENT',
  SOCIAL_CONTRIBUTION  = 'SOCIAL_CONTRIBUTION',
  /* FISCALITÉ */
  TAX_PAYMENT          = 'TAX_PAYMENT',
  VAT_COLLECTED        = 'VAT_COLLECTED',
  VAT_DEDUCTED         = 'VAT_DEDUCTED',
  /* EXCEPTIONNEL */
  FINE                 = 'FINE',
  LOSS                 = 'LOSS',
  GAIN                 = 'GAIN',
  /* CORRECTIONS */
  ADJUSTMENT           = 'ADJUSTMENT',
  OPENING_BALANCE      = 'OPENING_BALANCE',
  CLOSING_BALANCE      = 'CLOSING_BALANCE',
}
```

### 4.2 Account

```typescript
// core/models/account.model.ts

export interface Account {
  id: number;
  code: string;
  name: string;
  class: number;
  journalLines?: JournalLine[];
}

export interface CreateAccountDto {
  code: string;
  name: string;
  class: number;
}

export interface UpdateAccountDto extends Partial<CreateAccountDto> {}
```

### 4.3 JournalLine

```typescript
// core/models/journal-line.model.ts

export interface JournalLine {
  id?: number;
  debit: number;    // entier en centimes
  credit: number;   // entier en centimes
  accountId: number;
  entryId?: number;
}

export interface CreateJournalLineDto {
  debit: number;
  credit: number;
  accountId: number;
}
```

### 4.4 JournalEntry

```typescript
// core/models/journal-entry.model.ts

export interface JournalEntry {
  id: number;
  date: string;         // ISO 8601
  label: string;
  operationId?: number;
  lines: JournalLine[];
}

export interface CreateJournalEntryDto {
  date: string;
  label: string;
  operationId?: number;
  lines: CreateJournalLineDto[];
}

export interface UpdateJournalEntryDto extends Partial<CreateJournalEntryDto> {}
```

### 4.5 Operation

```typescript
// core/models/operation.model.ts (suite)

export interface Operation {
  id: number;
  type: OperationType;
  date: string;
  label: string;
  entries: JournalEntry[];
}

export interface CreateOperationDto {
  type: OperationType;
  date: string;
  label: string;
  entries?: CreateJournalEntryDto[];
}

export interface UpdateOperationDto extends Partial<CreateOperationDto> {}
```

---

## 5. Services HTTP

### 5.1 AccountService

| Méthode          | HTTP   | Endpoint          | Description            |
|------------------|--------|-------------------|------------------------|
| `getAll()`       | GET    | `/accounts`       | Liste tous les comptes |
| `getById(id)`    | GET    | `/accounts/:id`   | Détail d'un compte     |
| `create(dto)`    | POST   | `/accounts`       | Créer un compte        |
| `update(id,dto)` | PATCH  | `/accounts/:id`   | Modifier un compte     |
| `delete(id)`     | DELETE | `/accounts/:id`   | Supprimer un compte    |

```typescript
// core/services/account.service.ts

@Injectable({ providedIn: 'root' })
export class AccountService {
  private url = `${environment.apiUrl}/accounts`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<Account[]>                          { return this.http.get<Account[]>(this.url); }
  getById(id: number): Observable<Account>                { return this.http.get<Account>(`${this.url}/${id}`); }
  create(dto: CreateAccountDto): Observable<Account>      { return this.http.post<Account>(this.url, dto); }
  update(id: number, dto: UpdateAccountDto): Observable<Account> { return this.http.patch<Account>(`${this.url}/${id}`, dto); }
  delete(id: number): Observable<void>                    { return this.http.delete<void>(`${this.url}/${id}`); }
}
```

### 5.2 JournalEntryService

| Méthode              | HTTP   | Endpoint                              | Description              |
|----------------------|--------|---------------------------------------|--------------------------|
| `getAll(filter?)`    | GET    | `/journal-entries?operationId=`       | Liste avec filtre        |
| `getById(id)`        | GET    | `/journal-entries/:id`                | Détail avec lignes       |
| `create(dto)`        | POST   | `/journal-entries`                    | Créer écriture + lignes  |
| `update(id, dto)`    | PATCH  | `/journal-entries/:id`                | Modifier écriture        |
| `delete(id)`         | DELETE | `/journal-entries/:id`                | Supprimer                |

```typescript
// core/services/journal-entry.service.ts

@Injectable({ providedIn: 'root' })
export class JournalEntryService {
  private url = `${environment.apiUrl}/journal-entries`;
  constructor(private http: HttpClient) {}

  getAll(operationId?: number): Observable<JournalEntry[]> {
    const params = operationId ? { params: { operationId } } : {};
    return this.http.get<JournalEntry[]>(this.url, params);
  }
  getById(id: number): Observable<JournalEntry>                       { return this.http.get<JournalEntry>(`${this.url}/${id}`); }
  create(dto: CreateJournalEntryDto): Observable<JournalEntry>        { return this.http.post<JournalEntry>(this.url, dto); }
  update(id: number, dto: UpdateJournalEntryDto): Observable<JournalEntry> { return this.http.patch<JournalEntry>(`${this.url}/${id}`, dto); }
  delete(id: number): Observable<void>                                { return this.http.delete<void>(`${this.url}/${id}`); }
}
```

### 5.3 OperationService

| Méthode              | HTTP   | Endpoint           | Description                  |
|----------------------|--------|--------------------|------------------------------|
| `getAll(filter?)`    | GET    | `/operations`      | Liste avec filtres           |
| `getById(id)`        | GET    | `/operations/:id`  | Détail + écritures           |
| `create(dto)`        | POST   | `/operations`      | Créer opération complète     |
| `update(id, dto)`    | PATCH  | `/operations/:id`  | Modifier                     |
| `delete(id)`         | DELETE | `/operations/:id`  | Supprimer                    |

```typescript
// core/services/operation.service.ts

export interface OperationFilter {
  type?: OperationType;
  category?: OperationCategory;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable({ providedIn: 'root' })
export class OperationService {
  private url = `${environment.apiUrl}/operations`;
  constructor(private http: HttpClient) {}

  getAll(filter?: OperationFilter): Observable<Operation[]> {
    return this.http.get<Operation[]>(this.url, { params: { ...(filter ?? {}) } });
  }
  getById(id: number): Observable<Operation>                       { return this.http.get<Operation>(`${this.url}/${id}`); }
  create(dto: CreateOperationDto): Observable<Operation>           { return this.http.post<Operation>(this.url, dto); }
  update(id: number, dto: UpdateOperationDto): Observable<Operation> { return this.http.patch<Operation>(`${this.url}/${id}`, dto); }
  delete(id: number): Observable<void>                             { return this.http.delete<void>(`${this.url}/${id}`); }
}
```

---

## 6. Routing

### 6.1 Routes principales

```typescript
// app.routes.ts

export const routes: Routes = [
  { path: '',        redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(r => r.authRoutes),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: 'dashboard',  loadChildren: () => import('./features/dashboard/dashboard.routes').then(r => r.dashboardRoutes) },
      { path: 'accounts',   loadChildren: () => import('./features/accounts/accounts.routes').then(r => r.accountRoutes) },
      { path: 'journal',    loadChildren: () => import('./features/journal/journal.routes').then(r => r.journalRoutes) },
      { path: 'operations', loadChildren: () => import('./features/operations/operations.routes').then(r => r.operationRoutes) },
    ]
  },
  { path: '**', redirectTo: 'dashboard' },
];
```

### 6.2 Routes par feature

```typescript
// features/accounts/accounts.routes.ts
export const accountRoutes: Routes = [
  { path: '',        component: AccountListComponent   },
  { path: 'new',     component: AccountFormComponent   },
  { path: ':id',     component: AccountDetailComponent },
  { path: ':id/edit',component: AccountFormComponent   },
];

// features/journal/journal.routes.ts
export const journalRoutes: Routes = [
  { path: '',        component: JournalListComponent       },
  { path: 'new',     component: JournalEntryFormComponent  },
  { path: ':id',     component: JournalEntryDetailComponent},
  { path: ':id/edit',component: JournalEntryFormComponent  },
];

// features/operations/operations.routes.ts
export const operationRoutes: Routes = [
  { path: '',        component: OperationListComponent   },
  { path: 'new',     component: OperationFormComponent   },
  { path: ':id',     component: OperationDetailComponent },
  { path: ':id/edit',component: OperationFormComponent   },
];
```

---

## 7. Composants par feature

### 7.1 Feature : Auth

#### `LoginComponent`
- Formulaire : `email` (requis, email), `password` (requis, min 6 car.)
- Affichage erreur API sous le formulaire
- Lien "Créer un compte" → `/auth/register`
- Redirection `/dashboard` après succès

#### `RegisterComponent`
- Formulaire : `name` (requis), `email` (requis, email), `password` (requis, min 8 car.), `passwordConfirm` (requis)
- Validator cross-field `passwordMatchValidator`
- Lien "Se connecter" → `/auth/login`
- Redirection `/dashboard` après succès

---

### 7.2 Feature : Dashboard

#### `DashboardComponent`
- Résumé des soldes par classe de compte (1 à 8)
- Graphique de trésorerie (évolution mensuelle)
- Liste des 5 dernières opérations
- Indicateurs : Total actif, Total passif, Résultat net
- Raccourcis : "Nouvelle opération", "Voir le journal"

---

### 7.3 Feature : Accounts

#### `AccountListComponent`
- Tableau : **Code** | **Nom** | **Classe** | **Solde** | **Actions**
- Filtre par classe (1–8)
- Bouton "Nouveau compte"
- Actions : Voir / Modifier / Supprimer (confirmation modale)

#### `AccountFormComponent` *(création + édition)*
- Champ `code` : texte, requis, unique → validation async via `GET /accounts?code=`
- Champ `name` : texte, requis
- Champ `class` : nombre entier 1–8, requis
- En mode édition : pré-remplissage via `getById(id)`
- Boutons : Annuler / Enregistrer

#### `AccountDetailComponent`
- Informations du compte (code, nom, classe)
- Tableau des `journalLines` : Date | Libellé | Débit | Crédit
- Solde courant = ∑ débits − ∑ crédits (affiché en bas)
- Boutons : Modifier / Supprimer

---

### 7.4 Feature : Operations

#### `OperationListComponent`
- Tableau : **Date** | **Type** (badge coloré) | **Libellé** | **Nb écritures** | **Actions**
- Filtres : par catégorie, par type, par plage de dates
- Pagination
- Bouton "Nouvelle opération"
- Actions : Voir / Modifier / Supprimer

#### `OperationFormComponent` ⭐

C'est le formulaire central. Il permet de créer ou modifier une opération avec ses écritures et lignes imbriquées.

**Structure ReactiveForm :**

```
FormGroup: operationForm
├── type         : FormControl<OperationType>   (select groupé par catégorie)
├── date         : FormControl<string>           (date picker)
├── label        : FormControl<string>           (text)
└── entries      : FormArray
    └── [n] FormGroup (entryGroup) [validator: balancedEntryValidator]
        ├── date     : FormControl<string>
        ├── label    : FormControl<string>
        └── lines    : FormArray
            └── [n] FormGroup (lineGroup) [validator: singleSideValidator]
                ├── accountId : FormControl<number>  (AccountSelectComponent)
                ├── debit     : FormControl<number>
                └── credit    : FormControl<number>
```

**Validators métier :**

| Règle | Niveau | Message d'erreur |
|---|---|---|
| `debit` et `credit` ne peuvent pas être tous les deux > 0 | `lineGroup` | "Une ligne ne peut avoir à la fois un débit et un crédit" |
| `debit` OU `credit` doit être > 0 | `lineGroup` | "Débit ou crédit requis (pas les deux)" |
| ∑ débits = ∑ crédits | `entryGroup` | "L'écriture n'est pas équilibrée (Δ = X)" |
| Minimum 2 lignes par écriture | `entryGroup` | "Une écriture nécessite au moins 2 lignes" |
| Minimum 1 écriture par opération | `operationForm` | "L'opération nécessite au moins une écriture" |

```typescript
// Validator : ligne sur un seul côté
export function singleSideValidator(group: AbstractControl): ValidationErrors | null {
  const debit  = +group.get('debit')?.value  || 0;
  const credit = +group.get('credit')?.value || 0;
  if (debit > 0 && credit > 0) return { bothSides: true };
  if (debit === 0 && credit === 0) return { emptySide: true };
  return null;
}

// Validator : écriture équilibrée
export function balancedEntryValidator(group: AbstractControl): ValidationErrors | null {
  const lines       = (group.get('lines') as FormArray).controls;
  const totalDebit  = lines.reduce((s, l) => s + (+l.get('debit')?.value  || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (+l.get('credit')?.value || 0), 0);
  return totalDebit === totalCredit ? null : { unbalanced: { totalDebit, totalCredit } };
}
```

**UX du formulaire :**
- Indicateur temps réel par écriture : `Débit : X | Crédit : Y | Δ : Z` avec badge vert/rouge
- Pré-remplissage du libellé opération au choix du type (si champ vide)
- Bouton "+ Ajouter une ligne" par écriture
- Bouton "+ Ajouter une écriture" pour l'opération
- Icône de suppression sur chaque ligne et chaque écriture
- Bouton Annuler / Enregistrer (désactivé si formulaire invalide)

**Select type groupé par catégorie :**
```html
<mat-select formControlName="type">
  @for (category of categories; track category) {
    <mat-optgroup [label]="CATEGORY_LABELS[category]">
      @for (type of typesByCategory[category]; track type) {
        <mat-option [value]="type">
          <mat-icon>{{ config[type].icon }}</mat-icon>
          {{ config[type].label }}
        </mat-option>
      }
    </mat-optgroup>
  }
</mat-select>
```

#### `OperationDetailComponent`
- En-tête : type (badge), date, libellé
- Pour chaque écriture : tableau des lignes débit/crédit, sous-total
- Grand total global (∑ débits / ∑ crédits)
- Boutons : Modifier / Supprimer / Imprimer

---

### 7.5 Feature : Journal

#### `JournalListComponent`
- Vue Grand Livre tabulaire : **Date** | **Libellé écriture** | **Compte** | **Débit** | **Crédit**
- Filtres : par compte, par période, par type d'opération
- Total des colonnes Débit / Crédit en pied de tableau
- Export CSV
- Lien vers le détail de chaque écriture

#### `JournalEntryFormComponent` *(création + édition standalone)*
- Même structure de formulaire que dans `OperationFormComponent` mais pour une seule écriture
- Choix optionnel d'associer à une opération existante (`operationId`)

#### `JournalEntryDetailComponent`
- Date, libellé, opération associée (lien)
- Tableau des lignes : Compte (code + nom) | Débit | Crédit
- Vérification visuelle de l'équilibre
- Boutons : Modifier / Supprimer

---

## 8. Composants partagés

### `ConfirmDialogComponent`
- Reçoit `title`, `message` en `@Input()`
- Émet `confirmed` ou `cancelled`
- Utilisé pour toutes les suppressions

### `AlertComponent` / `AlertService`
- Toast de notification global (succès / erreur / info)
- `AlertService.success(msg)`, `.error(msg)`, `.info(msg)`
- Durée d'affichage : 4 secondes par défaut

### `AccountSelectComponent`
- Wrapper sur `mat-select` ou `mat-autocomplete`
- Charge la liste des comptes via `AccountService.getAll()`
- Affiche : `[code] - [nom]`
- Utilisé dans chaque `lineGroup` du formulaire

### `CurrencyInputComponent`
- Input numérique qui stocke la valeur en **centimes** (entier)
- Affichage formaté en unités avec 2 décimales
- Émet la valeur en centimes via `ControlValueAccessor`

### `BalanceIndicatorComponent`
- Reçoit `totalDebit` et `totalCredit` en `@Input()`
- Affiche : `Débit : X€ | Crédit : Y€ | Δ : Z€`
- Badge vert si équilibré, rouge sinon

### `AppShellComponent` / `NavbarComponent`
- Barre de navigation latérale ou supérieure
- Liens : Dashboard / Opérations / Journal / Comptes
- Affiche le nom de l'utilisateur connecté (`AuthService.currentUser`)
- Bouton "Déconnexion" appelle `AuthService.logout()`

---

## 9. Intercepteurs HTTP

### `AuthInterceptor`
Injecte le token JWT dans chaque requête sortante.

```typescript
// core/interceptors/auth.interceptor.ts

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next(req);
};
```

### `ErrorInterceptor`
Gestion centralisée des erreurs HTTP.

```typescript
// core/interceptors/error.interceptor.ts

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const alert = inject(AlertService);
  const auth  = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        auth.logout();  // Token expiré → retour login
        return EMPTY;
      }
      const msg = err.error?.message ?? 'Une erreur est survenue';
      alert.error(Array.isArray(msg) ? msg.join(' | ') : msg);
      return throwError(() => err);
    })
  );
};
```

### Enregistrement dans `app.config.ts`

```typescript
// app.config.ts

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    provideAnimationsAsync(),
  ]
};
```

---

## 10. Guards

### `authGuard`
Redirige vers `/auth/login` si l'utilisateur n'est pas authentifié.

```typescript
// core/guards/auth.guard.ts

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/auth/login']);
};
```

### `guestGuard`
Redirige vers `/dashboard` si l'utilisateur est déjà connecté (évite d'accéder à `/auth/login` inutilement).

```typescript
// core/guards/guest.guard.ts

export const guestGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;
};
```

---

## 11. Pipes utilitaires

### `CentsPipe`
```typescript
// shared/pipes/cents.pipe.ts
@Pipe({ name: 'cents', standalone: true })
export class CentsPipe implements PipeTransform {
  transform(value: number, currency = '€'): string {
    return `${(value / 100).toFixed(2)} ${currency}`;
  }
}
// Usage : {{ 12500 | cents }} → "125.00 €"
```

### `OperationTypePipe`
```typescript
// shared/pipes/operation-type.pipe.ts
@Pipe({ name: 'operationType', standalone: true })
export class OperationTypePipe implements PipeTransform {
  transform(type: OperationType, field: keyof OperationTypeConfig = 'label'): string {
    return OPERATION_TYPE_CONFIG[type]?.[field] as string ?? type;
  }
}
// Usage :
// {{ operation.type | operationType }}           → "Achat"
// {{ operation.type | operationType:'icon' }}    → "shopping_cart"
```

### `AccountCodePipe`
```typescript
// shared/pipes/account-code.pipe.ts
@Pipe({ name: 'accountCode', standalone: true })
export class AccountCodePipe implements PipeTransform {
  transform(id: number, accounts: Account[]): string {
    const acc = accounts.find(a => a.id === id);
    return acc ? `${acc.code} – ${acc.name}` : `#${id}`;
  }
}
// Usage : {{ line.accountId | accountCode:accounts }} → "512 – Banque"
```

---

## 12. Utilitaires OperationType

```typescript
// core/utils/operation-type.utils.ts

export type OperationCategory =
  | 'EXPLOITATION'
  | 'FINANCIERE'
  | 'PRETS_DETTES'
  | 'DONS_SUBVENTIONS'
  | 'INVESTISSEMENT'
  | 'SALAIRES_SOCIAL'
  | 'FISCALITE'
  | 'EXCEPTIONNEL'
  | 'CORRECTIONS';

export interface OperationTypeConfig {
  label:      string;
  category:   OperationCategory;
  icon:       string;       // Material icon name
  colorClass: string;       // CSS class
}

export const OPERATION_TYPE_CONFIG: Record<OperationType, OperationTypeConfig> = {
  // EXPLOITATION
  [OperationType.PURCHASE]:            { label: 'Achat',                  category: 'EXPLOITATION',     icon: 'shopping_cart',          colorClass: 'badge-red'    },
  [OperationType.SALE]:                { label: 'Vente',                  category: 'EXPLOITATION',     icon: 'point_of_sale',          colorClass: 'badge-green'  },
  [OperationType.SERVICE_EXPENSE]:     { label: 'Dépense de service',     category: 'EXPLOITATION',     icon: 'build',                  colorClass: 'badge-orange' },
  [OperationType.SERVICE_INCOME]:      { label: 'Revenu de service',      category: 'EXPLOITATION',     icon: 'work',                   colorClass: 'badge-green'  },
  // FINANCIÈRES
  [OperationType.PAYMENT]:             { label: 'Paiement',               category: 'FINANCIERE',       icon: 'payments',               colorClass: 'badge-red'    },
  [OperationType.RECEIPT]:             { label: 'Encaissement',           category: 'FINANCIERE',       icon: 'savings',                colorClass: 'badge-green'  },
  [OperationType.TRANSFER]:            { label: 'Transfert interne',      category: 'FINANCIERE',       icon: 'swap_horiz',             colorClass: 'badge-blue'   },
  [OperationType.BANK_DEPOSIT]:        { label: 'Dépôt bancaire',         category: 'FINANCIERE',       icon: 'account_balance',        colorClass: 'badge-blue'   },
  [OperationType.BANK_WITHDRAWAL]:     { label: 'Retrait bancaire',       category: 'FINANCIERE',       icon: 'money_off',              colorClass: 'badge-orange' },
  // PRÊTS & DETTES
  [OperationType.LOAN_GIVEN]:          { label: 'Prêt accordé',           category: 'PRETS_DETTES',     icon: 'trending_up',            colorClass: 'badge-purple' },
  [OperationType.LOAN_RECEIVED]:       { label: 'Prêt reçu',              category: 'PRETS_DETTES',     icon: 'trending_down',          colorClass: 'badge-purple' },
  [OperationType.LOAN_REPAYMENT]:      { label: 'Remboursement de prêt',  category: 'PRETS_DETTES',     icon: 'replay',                 colorClass: 'badge-purple' },
  [OperationType.DEBT_PAYMENT]:        { label: 'Paiement de dette',      category: 'PRETS_DETTES',     icon: 'receipt_long',           colorClass: 'badge-red'    },
  // DONS & SUBVENTIONS
  [OperationType.DONATION_GIVEN]:      { label: 'Don donné',              category: 'DONS_SUBVENTIONS', icon: 'volunteer_activism',     colorClass: 'badge-pink'   },
  [OperationType.DONATION_RECEIVED]:   { label: 'Don reçu',               category: 'DONS_SUBVENTIONS', icon: 'redeem',                 colorClass: 'badge-pink'   },
  [OperationType.SUBSIDY_RECEIVED]:    { label: 'Subvention reçue',       category: 'DONS_SUBVENTIONS', icon: 'account_balance_wallet', colorClass: 'badge-teal'   },
  // INVESTISSEMENTS
  [OperationType.ASSET_PURCHASE]:      { label: 'Achat immobilisation',   category: 'INVESTISSEMENT',   icon: 'real_estate_agent',      colorClass: 'badge-indigo' },
  [OperationType.ASSET_SALE]:          { label: 'Vente immobilisation',   category: 'INVESTISSEMENT',   icon: 'sell',                   colorClass: 'badge-indigo' },
  [OperationType.DEPRECIATION]:        { label: 'Amortissement',          category: 'INVESTISSEMENT',   icon: 'exposure_neg_1',         colorClass: 'badge-gray'   },
  // SALAIRES & SOCIAL
  [OperationType.SALARY_PAYMENT]:      { label: 'Paiement salaire',       category: 'SALAIRES_SOCIAL',  icon: 'badge',                  colorClass: 'badge-cyan'   },
  [OperationType.SOCIAL_CONTRIBUTION]: { label: 'Cotisations sociales',   category: 'SALAIRES_SOCIAL',  icon: 'groups',                 colorClass: 'badge-cyan'   },
  // FISCALITÉ
  [OperationType.TAX_PAYMENT]:         { label: "Paiement d'impôt",       category: 'FISCALITE',        icon: 'gavel',                  colorClass: 'badge-yellow' },
  [OperationType.VAT_COLLECTED]:       { label: 'TVA collectée',          category: 'FISCALITE',        icon: 'percent',                colorClass: 'badge-yellow' },
  [OperationType.VAT_DEDUCTED]:        { label: 'TVA déductible',         category: 'FISCALITE',        icon: 'percent',                colorClass: 'badge-yellow' },
  // EXCEPTIONNEL
  [OperationType.FINE]:                { label: 'Amende',                 category: 'EXCEPTIONNEL',     icon: 'warning',                colorClass: 'badge-red'    },
  [OperationType.LOSS]:                { label: 'Perte exceptionnelle',   category: 'EXCEPTIONNEL',     icon: 'trending_down',          colorClass: 'badge-red'    },
  [OperationType.GAIN]:                { label: 'Gain exceptionnel',      category: 'EXCEPTIONNEL',     icon: 'trending_up',            colorClass: 'badge-green'  },
  // CORRECTIONS
  [OperationType.ADJUSTMENT]:          { label: 'Ajustement comptable',   category: 'CORRECTIONS',      icon: 'tune',                   colorClass: 'badge-gray'   },
  [OperationType.OPENING_BALANCE]:     { label: "Solde d'ouverture",      category: 'CORRECTIONS',      icon: 'play_circle',            colorClass: 'badge-gray'   },
  [OperationType.CLOSING_BALANCE]:     { label: 'Solde de clôture',       category: 'CORRECTIONS',      icon: 'stop_circle',            colorClass: 'badge-gray'   },
};

export const CATEGORY_LABELS: Record<OperationCategory, string> = {
  EXPLOITATION:     '📦 Exploitation',
  FINANCIERE:       '💳 Financières',
  PRETS_DETTES:     '🤝 Prêts & Dettes',
  DONS_SUBVENTIONS: '🎁 Dons & Subventions',
  INVESTISSEMENT:   '🏗️ Investissements',
  SALAIRES_SOCIAL:  '👤 Salaires & Social',
  FISCALITE:        '🏛️ Fiscalité',
  EXCEPTIONNEL:     '⚠️ Exceptionnel',
  CORRECTIONS:      '🔧 Corrections',
};

// Helper : types groupés par catégorie → pour les <optgroup> du select
export const OPERATION_TYPES_BY_CATEGORY: Record<OperationCategory, OperationType[]> =
  (Object.entries(OPERATION_TYPE_CONFIG) as [OperationType, OperationTypeConfig][])
    .reduce((acc, [type, cfg]) => {
      acc[cfg.category] ??= [];
      acc[cfg.category].push(type);
      return acc;
    }, {} as Record<OperationCategory, OperationType[]>);
```

---

## 13. Résumé CRUD

| Feature        | Liste | Créer                        | Lire | Modifier | Supprimer |
|----------------|-------|------------------------------|------|----------|-----------|
| **Auth**       | —     | ✅ Register                  | —    | —        | —         |
| **Dashboard**  | —     | —                            | ✅   | —        | —         |
| **Account**    | ✅    | ✅                           | ✅   | ✅       | ✅        |
| **Operation**  | ✅    | ✅ (avec entries + lines)    | ✅   | ✅       | ✅        |
| **JournalEntry**| ✅   | ✅ (standalone ou via opération) | ✅ | ✅     | ✅        |

---

> **Point d'attention implémentation** : Le `OperationFormComponent` est le composant le plus complexe avec son `FormArray` doublement imbriqué (`entries → lines`) et ses validators d'équilibre en temps réel. Il est recommandé de l'isoler dans un service de formulaire dédié (`OperationFormService`) afin de séparer la logique de construction du formulaire de la logique de présentation.
