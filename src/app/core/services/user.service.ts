import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile, Role } from '../models/auth.model';
import { environment } from '../../../environments/environment';

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: Role;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = `${environment.apiUrl}/users`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(this.api);
  }

  create(dto: CreateUserDto): Observable<UserProfile> {
    return this.http.post<UserProfile>(this.api, dto);
  }

  update(id: number, dto: UpdateUserDto): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.api}/${id}`, dto);
  }

  toggleActive(id: number): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.api}/${id}/desactiver`, {});
  }
}
