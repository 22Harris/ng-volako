import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';
import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';
import { User } from '../models/auth.model';

/** AuthService minimal piloté par les tests. */
class AuthStub {
  user: User | null = null;
  isAuthenticated() {
    return !!this.user;
  }
  currentUser() {
    return this.user;
  }
}

const ADMIN: User = { id: 1, name: 'Admin', email: 'a@v.com', role: 'ADMIN' };
const COMPTABLE: User = { id: 2, name: 'Comptable', email: 'c@v.com', role: 'COMPTABLE' };

const ROUTE = {} as ActivatedRouteSnapshot;
const STATE = {} as RouterStateSnapshot;

function run(guard: CanActivateFn) {
  return TestBed.runInInjectionContext(() => guard(ROUTE, STATE));
}

function urlOf(result: unknown): string {
  return TestBed.inject(Router).serializeUrl(result as UrlTree);
}

describe('route guards', () => {
  let auth: AuthStub;

  beforeEach(() => {
    auth = new AuthStub();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
  });

  describe('authGuard', () => {
    it('autorise un utilisateur authentifié', () => {
      auth.user = COMPTABLE;
      expect(run(authGuard)).toBe(true);
    });

    it('redirige vers /auth/login un visiteur anonyme', () => {
      auth.user = null;
      const result = run(authGuard);
      expect(result).toBeInstanceOf(UrlTree);
      expect(urlOf(result)).toBe('/auth/login');
    });
  });

  describe('guestGuard', () => {
    it('autorise un visiteur anonyme', () => {
      auth.user = null;
      expect(run(guestGuard)).toBe(true);
    });

    it('redirige vers /dashboard un utilisateur déjà connecté', () => {
      auth.user = COMPTABLE;
      expect(urlOf(run(guestGuard))).toBe('/dashboard');
    });
  });

  describe('adminGuard', () => {
    it('autorise le rôle ADMIN', () => {
      auth.user = ADMIN;
      expect(run(adminGuard)).toBe(true);
    });

    it('redirige vers /dashboard un rôle non-admin', () => {
      auth.user = COMPTABLE;
      expect(urlOf(run(adminGuard))).toBe('/dashboard');
    });

    it('redirige vers /dashboard un visiteur anonyme', () => {
      auth.user = null;
      expect(urlOf(run(adminGuard))).toBe('/dashboard');
    });
  });
});
