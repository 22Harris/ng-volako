import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { environment } from '../../../environments/environment';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('ajoute withCredentials sur les requêtes vers notre API', () => {
    httpClient.get(`${environment.apiUrl}/accounts`).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/accounts`);
    expect(req.request.withCredentials).toBe(true);
    req.flush([]);
  });

  it('n\'ajoute pas withCredentials sur une API externe', () => {
    httpClient.get('https://api.frankfurter.app/latest').subscribe();
    const req = http.expectOne('https://api.frankfurter.app/latest');
    expect(req.request.withCredentials).toBe(false);
    req.flush({});
  });
});
