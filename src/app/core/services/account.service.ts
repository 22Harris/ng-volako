import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Account, CreateAccountDto, UpdateAccountDto } from '../models/account.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly api = `${environment.apiUrl}/account`;

  constructor(private readonly http: HttpClient) {}

  private toFrontend(raw: any): Account {
    return { id: raw.id, code: raw.code, name: raw.name, class: raw.account_class ?? raw.class };
  }

  private toBackend(dto: CreateAccountDto | UpdateAccountDto): any {
    const { class: cls, ...rest } = dto as any;
    return { ...rest, account_class: cls };
  }

  getAll(): Observable<Account[]> {
    return this.http.get<any[]>(this.api).pipe(map(list => list.map(r => this.toFrontend(r))));
  }

  getById(id: number): Observable<Account> {
    return this.http.get<any>(`${this.api}/${id}`).pipe(map(r => this.toFrontend(r)));
  }

  create(dto: CreateAccountDto): Observable<Account> {
    return this.http.post<any>(this.api, this.toBackend(dto)).pipe(map(r => this.toFrontend(r)));
  }

  update(id: number, dto: UpdateAccountDto): Observable<Account> {
    return this.http.patch<any>(`${this.api}/${id}`, this.toBackend(dto)).pipe(map(r => this.toFrontend(r)));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  checkCode(code: string): Observable<Account[]> {
    return this.http.get<any[]>(`${this.api}/search?term=${encodeURIComponent(code)}`).pipe(map(list => list.map(r => this.toFrontend(r))));
  }
}
