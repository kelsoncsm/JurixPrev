import { Injectable } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService, PerfilUsuario } from '../services/auth.service';

export function roleGuard(rolesPermitidos: PerfilUsuario[]): CanMatchFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const perfil = auth.getPerfil();
    if (rolesPermitidos.includes(perfil)) {
      return true;
    }
    router.navigate(['/painel-usuario']);
    return false;
  };
}
