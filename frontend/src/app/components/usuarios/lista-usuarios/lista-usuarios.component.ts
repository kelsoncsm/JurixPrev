import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService, Usuario, UsuarioCreate, UsuarioUpdate } from 'src/app/services/usuario.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-usuarios.component.html',
  styleUrls: ['./lista-usuarios.component.scss']
})
export class ListaUsuariosComponent {
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  carregando = false;
  termoBusca = '';
  // Form fields
  nome = '';
  login = '';
  senha = '';
  perfil: 'A' | 'U' = 'U';
  editingUserId: string | null = null;
  alterarSenha = false;

  constructor(private usuariosService: UsuarioService, private router: Router) {
    this.loadUsuarios();
  }

  loadUsuarios() {
    this.carregando = true;
    this.usuariosService.listarUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.aplicarFiltro();
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao listar usuários:', err);
        alert(err?.error?.detail || 'Falha ao listar usuários');
        this.carregando = false;
      }
    });
  }

  aplicarFiltro() {
    const termo = (this.termoBusca || '').trim().toLowerCase();
    if (!termo) {
      this.usuariosFiltrados = [...this.usuarios];
      return;
    }
    this.usuariosFiltrados = this.usuarios.filter(u =>
      u.nome.toLowerCase().includes(termo) ||
      u.login.toLowerCase().includes(termo) ||
      u.perfil.toLowerCase().includes(termo) ||
      (u.status || 'A').toLowerCase().includes(termo)
    );
  }

  onBuscar() {
    this.aplicarFiltro();
  }

  novoUsuario() {
    this.router.navigate(['/usuarios/novo']);
  }

  editar(u: Usuario) {
    this.editingUserId = u.id;
    this.nome = u.nome;
    this.login = u.login; // login não será editável, mas exibimos
    this.perfil = u.perfil;
    this.senha = '';
    this.alterarSenha = false;
  }

  excluir(u: Usuario) {
    if (!confirm(`Excluir usuário ${u.nome} (${u.login})?`)) return;
    this.carregando = true;
    this.usuariosService.excluirUsuario(u.id).subscribe({
      next: () => {
        this.usuarios = this.usuarios.filter(x => x.id !== u.id);
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao excluir usuário:', err);
        alert(err?.error?.detail || 'Falha ao excluir usuário');
        this.carregando = false;
      }
    });
  }

  inativar(u: Usuario) {
    if (!confirm(`Inativar usuário ${u.nome} (${u.login})?`)) return;
    const data: UsuarioUpdate = { nome: u.nome, perfil: u.perfil, status: 'I' };
    this.carregando = true;
    this.usuariosService.atualizarUsuario(u.id, data).subscribe({
      next: (atualizado) => {
        const idx = this.usuarios.findIndex(x => x.id === atualizado.id);
        if (idx >= 0) this.usuarios[idx] = atualizado;
        this.aplicarFiltro();
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao inativar usuário:', err);
        alert(err?.error?.detail || 'Falha ao inativar usuário');
        this.carregando = false;
      }
    });
  }

  reativar(u: Usuario) {
    if (!confirm(`Reativar usuário ${u.nome} (${u.login})?`)) return;
    const data: UsuarioUpdate = { nome: u.nome, perfil: u.perfil, status: 'A' };
    this.carregando = true;
    this.usuariosService.atualizarUsuario(u.id, data).subscribe({
      next: (atualizado) => {
        const idx = this.usuarios.findIndex(x => x.id === atualizado.id);
        if (idx >= 0) this.usuarios[idx] = atualizado;
        this.aplicarFiltro();
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao reativar usuário:', err);
        alert(err?.error?.detail || 'Falha ao reativar usuário');
        this.carregando = false;
      }
    });
  }

  registrar() {
    if (this.editingUserId) {
      const data: UsuarioUpdate = { nome: this.nome, perfil: this.perfil };
      if (this.alterarSenha) {
        const senha = (this.senha || '').trim();
        if (!senha || senha.length < 6) {
          alert('A nova senha deve ter pelo menos 6 caracteres.');
          return;
        }
        data.senha = senha;
      }
      this.carregando = true;
      this.usuariosService.atualizarUsuario(this.editingUserId, data).subscribe({
        next: (u) => {
          const idx = this.usuarios.findIndex(x => x.id === u.id);
          if (idx >= 0) this.usuarios[idx] = u;
          this.resetForm();
          this.carregando = false;
        },
        error: (err) => {
          console.error('Erro ao atualizar usuário:', err);
          alert(err?.error?.detail || 'Falha ao atualizar usuário');
          this.carregando = false;
        }
      });
      return;
    }
    // criar novo
    const data: UsuarioCreate = { nome: this.nome, login: this.login, senha: this.senha, perfil: this.perfil };
    this.carregando = true;
    this.usuariosService.registrarUsuario(data).subscribe({
      next: (u) => {
        this.usuarios.push(u);
        this.resetForm();
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao registrar usuário:', err);
        alert(err?.error?.detail || 'Falha ao registrar usuário');
        this.carregando = false;
      }
    });
  }

  resetForm() {
    this.nome = '';
    this.login = '';
    this.senha = '';
    this.perfil = 'U';
    this.editingUserId = null;
    this.alterarSenha = false;
  }
}