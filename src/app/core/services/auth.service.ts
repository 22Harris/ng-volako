import { Injectable, signal, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { User, AuthResponse, LoginDto, RegisterDto, Role } from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private readonly api = `${environment.apiUrl}/auth`;

  private readonly IDLE_TIMEOUT_MS = 30 * 60 * 1000;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly activityEvents = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];
  private readonly boundReset = () => this.resetIdleTimer();

  currentUser = signal<User | null>(null);

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  /** Appelé au démarrage via APP_INITIALIZER pour restaurer la session depuis le cookie httpOnly. */
  initUser(): Observable<void> {
    return this.http.get<User>(`${this.api}/me`, { withCredentials: true }).pipe(
      tap(user => {
        this.currentUser.set(user);
        this.startIdleTimer();
      }),
      catchError(() => {
        this.currentUser.set(null);
        return of(null);
      }),
      map(() => undefined),
    );
  }

  login(dto: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/login`, dto, { withCredentials: true }).pipe(
      tap(res => {
        this.currentUser.set(res.user);
        this.startIdleTimer();
      }),
    );
  }

  register(dto: RegisterDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/register`, dto, { withCredentials: true }).pipe(
      tap(res => {
        this.currentUser.set(res.user);
        this.startIdleTimer();
      }),
    );
  }

  logout(): void {
    this.clearSession();
    this.http.post(`${this.api}/logout`, {}, { withCredentials: true }).subscribe();
  }

  /** Vide la session locale sans appeler l'API (utilisé par l'intercepteur en cas d'échec de refresh). */
  clearSession(): void {
    this.stopIdleTimer();
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    return !!this.currentUser();
  }

  hasRole(...roles: Role[]): boolean {
    const role = this.currentUser()?.role;
    return role ? (roles as string[]).includes(role) : false;
  }

  private startIdleTimer(): void {
    this.stopIdleTimer();
    this.activityEvents.forEach(event =>
      document.addEventListener(event, this.boundReset, { passive: true }),
    );
    this.resetIdleTimer();
  }

  private stopIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    this.activityEvents.forEach(event =>
      document.removeEventListener(event, this.boundReset),
    );
  }

  private resetIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => this.logout(), this.IDLE_TIMEOUT_MS);
  }

  ngOnDestroy(): void {
    this.stopIdleTimer();
  }
}
