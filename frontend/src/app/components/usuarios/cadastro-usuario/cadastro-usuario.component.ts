import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { UsuarioService } from 'src/app/services/usuario.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-cadastro-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, SharedModule],
  templateUrl: './cadastro-usuario.component.html',
  styleUrls: ['./cadastro-usuario.component.scss']
})
export class CadastroUsuarioComponent {
  carregando = false;
  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    login: ['', [Validators.required, Validators.minLength(3)]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
    perfil: ['U', [Validators.required]],
    status: ['A', [Validators.required]]
  });

  constructor(private fb: FormBuilder, private usuarios: UsuarioService, private router: Router) {}

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.carregando = true;
    const { nome, login, senha, perfil, status } = this.form.getRawValue();
    try {
      const perfilFinal: 'A' | 'U' = (perfil || 'U').toUpperCase() === 'A' ? 'A' : 'U';
      const statusFinal: 'A' | 'I' = (status || 'A').toUpperCase() === 'I' ? 'I' : 'A';
      await firstValueFrom(this.usuarios.registrarUsuario({ nome: nome!, login: login!, senha: senha!, perfil: perfilFinal, status: statusFinal }));
      alert('Usuário registrado com sucesso!');
      this.router.navigate(['/usuarios']);
    } catch (e: any) {
      const msg = e?.error?.detail || 'Erro ao registrar usuário.';
      alert(msg);
    } finally {
      this.carregando = false;
    }
  }
}