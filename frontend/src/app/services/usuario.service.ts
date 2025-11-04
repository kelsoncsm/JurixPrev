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

export interface UsuarioUpdate {
  nome: string;
  perfil: 'ADMINISTRATIVO' | 'USUARIO';
  senha?: string;
}

export interface AuthLoginRequest {
  login: string;
  senha: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: 'bearer';
  usuario: Usuario;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private baseUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  listarUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.baseUrl}`);
  }

  registrarUsuario(data: UsuarioCreate): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.baseUrl}/register`, data);
  }

  atualizarUsuario(id: string, data: UsuarioUpdate): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/${id}`, data);
  }

  excluirUsuario(id: string): Observable<{ ok: boolean }>{
    return this.http.delete<{ ok: boolean }>(`${this.baseUrl}/${id}`);
  }

  obterUsuarioPorLogin(login: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.baseUrl}/by-login/${encodeURIComponent(login)}`);
  }

  autenticar(data: AuthLoginRequest): Observable<AuthTokenResponse> {
    return this.http.post<AuthTokenResponse>(`${environment.apiUrl}/auth/login`, data);
  }
}