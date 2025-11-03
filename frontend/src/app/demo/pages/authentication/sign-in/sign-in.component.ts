// angular import
import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

// project import
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { BrandingService } from 'src/app/services/branding.service';
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
  email: string = '';

  async onSignIn() {
    const email = this.email?.trim();
    if (email) {
      const ok = await this.trySetClientLogoFromBackend(email);
      if (!ok) {
        // Fallback para logo por ativos locais baseado no e-mail
        await this.trySetClientLogoByEmail(email);
      }
    }
    // Lógica de autenticação simplificada; redireciona ao painel
    this.router.navigate(['/painel-usuario']);
  }

  private async trySetClientLogoFromBackend(email: string) {
    try {
      const cliente = await firstValueFrom(this.clientes.obterClientePorEmail(email));
      const url = cliente?.logoUrl?.trim();
      if (url) {
        this.branding.setLogo(url);
        return true;
      }
    } catch (e) {
      // silencioso; usaremos fallback
    }
    return false;
  }

  private async trySetClientLogoByEmail(email: string) {
    const localPart = email.split('@')[0].toLowerCase();
    const folder = localPart.replace(/[^a-z0-9_-]/g, '');
    const base = `assets/${folder}`;
    const candidates = [
      `${base}/logo.svg`,
      `${base}/logo.png`,
      `${base}/logo.jpg`,
      `${base}/logo.jpeg`
    ];
    for (const url of candidates) {
      try {
        const res = await fetch(url, { method: 'HEAD' });
        if (res.ok) {
          this.branding.setLogo(url);
          return true;
        }
      } catch {}
    }
    this.branding.resetLogo();
    return false;
  }
}
