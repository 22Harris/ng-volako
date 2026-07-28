import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AccountService } from './account.service';
import { environment } from '../../../environments/environment';

const API = `${environment.apiUrl}/account`;

describe('AccountService', () => {
  let service: AccountService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AccountService],
    });
    service = TestBed.inject(AccountService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getAll — mappe account_class du backend vers class du frontend', () => {
    let result: any;
    service.getAll().subscribe((r) => (result = r));

    const req = http.expectOne(API);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, code: '512', name: 'Banque', account_class: 5 }]);

    expect(result).toEqual([{ id: 1, code: '512', name: 'Banque', class: 5, isSystem: false }]);
  });

  it('create — convertit class en account_class dans le corps de la requête', () => {
    service.create({ code: '606', name: 'Achats', class: 6 }).subscribe();

    const req = http.expectOne(API);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ code: '606', name: 'Achats', account_class: 6 });
    req.flush({ id: 9, code: '606', name: 'Achats', account_class: 6 });
  });

  it('update — PATCH avec mapping et URL incluant l\'id', () => {
    service.update(9, { name: 'Achats stockés' }).subscribe();

    const req = http.expectOne(`${API}/9`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ name: 'Achats stockés', account_class: undefined });
    req.flush({ id: 9, code: '606', name: 'Achats stockés', account_class: 6 });
  });

  it('delete — DELETE sur l\'id', () => {
    service.delete(3).subscribe();
    const req = http.expectOne(`${API}/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('checkCode — encode le terme dans l\'URL de recherche', () => {
    service.checkCode('60 6').subscribe();
    const req = http.expectOne(`${API}/search?term=60%206`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('initPcg — POST init-pcg et renvoie le compte rendu', () => {
    let result: any;
    service.initPcg().subscribe((r) => (result = r));
    const req = http.expectOne(`${API}/init-pcg`);
    expect(req.request.method).toBe('POST');
    req.flush({ created: 42, skipped: 0 });
    expect(result).toEqual({ created: 42, skipped: 0 });
  });
});
