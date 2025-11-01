// angular import
import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

// project import
import { SharedModule } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-sign-in',
  imports: [SharedModule, RouterModule],
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent {
  private router = inject(Router);

  onSignIn() {
    // Aqui você pode adicionar a lógica de autenticação
    // Por enquanto, vamos apenas redirecionar para o dashboard
    this.router.navigate(['/dashboard']);
  }
}
