import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Usuario {
  id: string;
  nome: string;
  login: string;
  perfil: 'ADMINISTRATIVO' | 'USUARIO';
}

export interface UsuarioCreate {
  nome: string;
  login: string;
  senha: string;
  perfil?: 'ADMINISTRATIVO' | 'USUARIO';
}

export interface AuthLoginRequest {
  login: string;
  senha: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private baseUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  registrarUsuario(data: UsuarioCreate): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.baseUrl}/register`, data);
  }

  obterUsuarioPorLogin(login: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.baseUrl}/by-login/${encodeURIComponent(login)}`);
  }

  autenticar(data: AuthLoginRequest): Observable<Usuario> {
    return this.http.post<Usuario>(`${environment.apiUrl}/auth/login`, data);
  }
}