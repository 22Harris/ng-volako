import { HttpInterceptorFn } from '@angular/common/http';

// Les cookies httpOnly sont envoyés automatiquement par le navigateur.
// Cet intercepteur s'assure uniquement que withCredentials est activé sur chaque requête.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};
