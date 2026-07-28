import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { OperationService } from './operation.service';
import { OperationType } from '../models/operation.model';
import { environment } from '../../../environments/environment';

const API = `${environment.apiUrl}/operations`;

const op = (id: number, type: OperationType) =>
  ({ id, type, date: '2026-01-01', label: `op-${id}`, entries: [] }) as any;

describe('OperationService', () => {
  let service: OperationService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), OperationService],
    });
    service = TestBed.inject(OperationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getAll — sans filtre, ne pose aucun query param', () => {
    service.getAll().subscribe();
    const req = http.expectOne((r) => r.url === API);
    expect(req.request.params.keys()).toEqual([]);
    req.flush([]);
  });

  it('getAll — transmet type, dateFrom et dateTo en query params', () => {
    service
      .getAll({ type: OperationType.SALE, dateFrom: '2026-01-01', dateTo: '2026-01-31' })
      .subscribe();

    const req = http.expectOne((r) => r.url === API);
    expect(req.request.params.get('type')).toBe(OperationType.SALE);
    expect(req.request.params.get('dateFrom')).toBe('2026-01-01');
    expect(req.request.params.get('dateTo')).toBe('2026-01-31');
    req.flush([]);
  });

  it('getAll — la catégorie filtre côté client et n\'est pas envoyée au backend', () => {
    let result: any[] = [];
    service.getAll({ category: 'EXPLOITATION' }).subscribe((r) => (result = r));

    const req = http.expectOne((r) => r.url === API);
    expect(req.request.params.has('category')).toBe(false);
    req.flush([op(1, OperationType.PURCHASE), op(2, OperationType.PAYMENT)]);

    // PURCHASE est EXPLOITATION, PAYMENT est FINANCIERE → seule l'opération 1 reste
    expect(result.map((o) => o.id)).toEqual([1]);
  });

  it('create — POST avec le DTO', () => {
    const dto = { type: OperationType.SALE, date: '2026-01-01', label: 'Vente' } as any;
    service.create(dto).subscribe();
    const req = http.expectOne(API);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(op(1, OperationType.SALE));
  });

  it('delete — DELETE sur l\'id', () => {
    service.delete(7).subscribe();
    const req = http.expectOne(`${API}/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
