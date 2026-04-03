import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// Les cookies httpOnly sont envoyés automatiquement par le navigateur.
// withCredentials est appliqué uniquement aux requêtes vers notre propre API
// pour éviter les erreurs CORS avec les APIs externes (ex: frankfurter.app).
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith(environment.apiUrl)) {
    return next(req.clone({ withCredentials: true }));
  }
  return next(req);
};
