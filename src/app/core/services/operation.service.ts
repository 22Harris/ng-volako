import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Operation, CreateOperationDto, UpdateOperationDto, OperationType } from '../models/operation.model';
import { OperationCategory, OPERATION_TYPE_CONFIG } from '../utils/operation-type.utils';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';

export interface OperationFilter {
  type?: OperationType;
  category?: OperationCategory;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable({ providedIn: 'root' })
export class OperationService {
  private readonly api = `${environment.apiUrl}/operations`;

  constructor(private readonly http: HttpClient) {}

  getAll(filter?: OperationFilter): Observable<Operation[]> {
    let params = new HttpParams();
    if (filter?.type)     params = params.set('type', filter.type);
    if (filter?.dateFrom) params = params.set('dateFrom', filter.dateFrom);
    if (filter?.dateTo)   params = params.set('dateTo', filter.dateTo);

    return this.http.get<Operation[]>(this.api, { params }).pipe(
      map(ops => filter?.category
        ? ops.filter(o => OPERATION_TYPE_CONFIG[o.type]?.category === filter.category)
        : ops
      ),
    );
  }

  getById(id: number): Observable<Operation> {
    return this.http.get<Operation>(`${this.api}/${id}`);
  }

  create(dto: CreateOperationDto): Observable<Operation> {
    return this.http.post<Operation>(this.api, dto);
  }

  update(id: number, dto: UpdateOperationDto): Observable<Operation> {
    return this.http.patch<Operation>(`${this.api}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
