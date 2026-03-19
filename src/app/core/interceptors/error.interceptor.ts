import { HttpInterceptorFn, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, EMPTY, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AlertService } from '../../shared/components/alert/alert.service';
import { environment } from '../../../environments/environment';

let isRefreshing = false;

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const alert = inject(AlertService);
  const auth  = inject(AuthService);
  const http  = inject(HttpClient);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Les routes auth gèrent leurs propres erreurs — ne pas intercepter ici
      if (req.url.includes('/auth/')) {
        return throwError(() => err);
      }

      if (err.status === 401) {
        // Si un refresh est déjà en cours, on attend sans déclencher une boucle
        if (isRefreshing) return EMPTY;

        isRefreshing = true;
        return http
          .post(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true })
          .pipe(
            switchMap(() => {
              isRefreshing = false;
              return next(req.clone({ withCredentials: true }));
            }),
            catchError(() => {
              isRefreshing = false;
              auth.clearSession();
              return EMPTY;
            }),
          );
      }

      const msg = err.error?.message ?? 'Une erreur est survenue';
      alert.error(Array.isArray(msg) ? msg.join(' | ') : msg);
      return throwError(() => err);
    }),
  );
};
