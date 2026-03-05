import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Account, CreateAccountDto, UpdateAccountDto } from '../models/account.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly api = `${environment.apiUrl}/account`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Account[]> {
    return this.http.get<Account[]>(this.api);
  }

  getById(id: number): Observable<Account> {
    return this.http.get<Account>(`${this.api}/${id}`);
  }

  create(dto: CreateAccountDto): Observable<Account> {
    return this.http.post<Account>(this.api, dto);
  }

  update(id: number, dto: UpdateAccountDto): Observable<Account> {
    return this.http.patch<Account>(`${this.api}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  checkCode(code: string): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.api}/search?term=${encodeURIComponent(code)}`);
  }
}
