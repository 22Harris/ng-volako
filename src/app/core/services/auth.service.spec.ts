import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { User } from '../models/auth.model';

const MOCK_USER: User = { id: 1, name: 'Test User', email: 'test@volako.com', role: 'CHEF_COMPTABLE' };

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        AuthService,
      ],
    });

    service = TestBed.inject(AuthService);
    http    = TestBed.inject(HttpTestingController);
    router  = TestBed.inject(Router);
  });

  afterEach(() => {
    http.verify();
  });

  // ─── initUser ───────────────────────────────────────────────────────────────

  it('initUser — charge l\'utilisateur et démarre le timer inactif', () => {
    let emitted = false;
    service.initUser().subscribe(() => { emitted = true; });

    const req = http.expectOne((r) => r.url.includes('/auth/me'));
    expect(req.request.withCredentials).toBe(true);
    req.flush(MOCK_USER);

    expect(emitted).toBe(true);
    expect(service.currentUser()).toEqual(MOCK_USER);
    expect(service.isAuthenticated()).toBe(true);

    // Nettoyage timer
    service.ngOnDestroy();
  });

  it('initUser — définit currentUser à null si /me échoue', () => {
    service.initUser().subscribe();

    http.expectOne((r) => r.url.includes('/auth/me')).flush('', { status: 401, statusText: 'Unauthorized' });

    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  // ─── login ──────────────────────────────────────────────────────────────────

  it('login — met à jour currentUser à la réponse', () => {
    service.login({ email: 'test@volako.com', password: 'Test1234!' }).subscribe();

    const req = http.expectOne((r) => r.url.includes('/auth/login'));
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ user: MOCK_USER });

    expect(service.currentUser()).toEqual(MOCK_USER);

    service.ngOnDestroy();
  });

  // ─── logout ─────────────────────────────────────────────────────────────────

  it('logout — vide la session et redirige vers /auth/login', () => {
    service.currentUser.set(MOCK_USER);
    const navigateSpy = vi.spyOn(router, 'navigate');

    service.logout();

    http.expectOne((r) => r.url.includes('/auth/logout')).flush({});

    expect(service.currentUser()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
  });

  it('clearSession — vide la session sans appeler /auth/logout', () => {
    service.currentUser.set(MOCK_USER);
    const navigateSpy = vi.spyOn(router, 'navigate');

    service.clearSession();

    http.expectNone((r) => r.url.includes('/auth/logout'));
    expect(service.currentUser()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
  });

  // ─── hasRole ────────────────────────────────────────────────────────────────

  it('hasRole — retourne true si le rôle correspond', () => {
    service.currentUser.set(MOCK_USER);
    expect(service.hasRole('CHEF_COMPTABLE')).toBe(true);
    expect(service.hasRole('ADMIN', 'CHEF_COMPTABLE')).toBe(true);
  });

  it('hasRole — retourne false si le rôle ne correspond pas', () => {
    service.currentUser.set(MOCK_USER);
    expect(service.hasRole('ADMIN')).toBe(false);
    expect(service.hasRole('AUDITEUR', 'COMPTABLE')).toBe(false);
  });

  it('hasRole — retourne false si non authentifié', () => {
    service.currentUser.set(null);
    expect(service.hasRole('ADMIN')).toBe(false);
  });
});
