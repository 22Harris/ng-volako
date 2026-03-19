import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { User, AuthResponse, LoginDto, RegisterDto } from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly USER_KEY = 'auth_user';
  private readonly api = `${environment.apiUrl}/auth`;

  currentUser = signal<User | null>(this.loadUser());

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  login(dto: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/login`, dto, { withCredentials: true }).pipe(
      tap(res => this.persist(res)),
    );
  }

  register(dto: RegisterDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/register`, dto, { withCredentials: true }).pipe(
      tap(res => this.persist(res)),
    );
  }

  logout(): void {
    this.clearSession();
    this.http.post(`${this.api}/logout`, {}, { withCredentials: true }).subscribe();
  }

  /** Vide la session locale sans appeler l'API (utilisé par l'intercepteur en cas d'échec de refresh) */
  clearSession(): void {
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    return !!this.loadUser();
  }

  private persist(res: AuthResponse): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
