import { Injectable } from '@angular/core';

export type PerfilUsuario = 'A' | 'U';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private perfilKey = 'perfil';
  private tokenKey = 'access_token';
  private usuarioIdKey = 'usuario_id';

  getPerfil(): PerfilUsuario {
    const p = (localStorage.getItem(this.perfilKey) || 'U').toUpperCase();
    return (p === 'A' ? 'A' : 'U');
  }

  setPerfil(perfil: PerfilUsuario) {
    localStorage.setItem(this.perfilKey, perfil);
  }

  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setUsuarioId(id: string) {
    localStorage.setItem(this.usuarioIdKey, id);
  }

  getUsuarioId(): string | null {
    return localStorage.getItem(this.usuarioIdKey);
  }
}