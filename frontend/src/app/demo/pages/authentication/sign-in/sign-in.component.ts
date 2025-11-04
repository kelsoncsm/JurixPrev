// angular import
import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

// project import
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { BrandingService } from 'src/app/services/branding.service';
import { AuthService } from 'src/app/services/auth.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { ClienteService } from 'src/app/services/cliente.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-sign-in',
  imports: [SharedModule, RouterModule],
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent {
  private router = inject(Router);
  private branding = inject(BrandingService);
  private clientes = inject(ClienteService);
  private auth = inject(AuthService);
  private usuarios = inject(UsuarioService);
  login: string = '';
  senha: string = '';

  async onSignIn() {
    const login = this.login?.trim();
    const senha = this.senha?.trim();
    // Não há mais busca de logo por assets/<login>; sempre usa logo padrão
    this.branding.resetLogo();
    if (!login || !senha) {
      alert('Informe login e senha.');
      return;
    }
    // Autentica no backend e define perfil conforme resposta
    try {
      const res = await firstValueFrom(this.usuarios.autenticar({ login, senha }));
      const perfil = (res?.usuario?.perfil || 'USUARIO').toUpperCase();
      this.auth.setPerfil(perfil === 'ADMINISTRATIVO' ? 'ADMINISTRATIVO' : 'USUARIO');
      if (res?.access_token) {
        this.auth.setToken(res.access_token);
      }
      if (res?.usuario?.id) {
        this.auth.setUsuarioId(res.usuario.id);
      }
      this.router.navigate(['/painel-usuario']);
    } catch (e: any) {
      const msg = e?.error?.detail || 'Credenciais inválidas';
      alert(msg);
    }
  }

  // Removido: busca de logo por assets/<login> ou e-mail

  private async trySetPerfilFromBackend(login: string) {
    // Mantido por compatibilidade, não usado no fluxo principal
    try {
      const usuario = await firstValueFrom(this.usuarios.obterUsuarioPorLogin(login));
      const perfil = (usuario?.perfil || 'USUARIO').toUpperCase();
      this.auth.setPerfil(perfil === 'ADMINISTRATIVO' ? 'ADMINISTRATIVO' : 'USUARIO');
    } catch {
      this.auth.setPerfil('USUARIO');
    }
  }
}
