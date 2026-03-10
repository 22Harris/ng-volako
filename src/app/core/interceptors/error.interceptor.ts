import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, EMPTY, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AlertService } from '../../shared/components/alert/alert.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const alert = inject(AlertService);
  const auth  = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Auth routes manage their own errors (inline + toast) — never intercept them here
      if (req.url.includes('/auth/')) {
        return throwError(() => err);
      }
      if (err.status === 401) {
        auth.logout();
        return EMPTY;
      }
      const msg = err.error?.message ?? 'Une erreur est survenue';
      alert.error(Array.isArray(msg) ? msg.join(' | ') : msg);
      return throwError(() => err);
    })
  );
};
