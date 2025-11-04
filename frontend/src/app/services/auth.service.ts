import { Injectable } from '@angular/core';

export type PerfilUsuario = 'ADMINISTRATIVO' | 'USUARIO';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private perfilKey = 'perfil';

  getPerfil(): PerfilUsuario {
    const p = (localStorage.getItem(this.perfilKey) || 'USUARIO').toUpperCase();
    return (p === 'ADMINISTRATIVO' ? 'ADMINISTRATIVO' : 'USUARIO');
  }

  setPerfil(perfil: PerfilUsuario) {
    localStorage.setItem(this.perfilKey, perfil);
  }
}