import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Cliente } from '../../../models/cliente.model';
import { AuthService, PerfilUsuario } from '../../../services/auth.service';
import { ClienteService } from '../../../services/cliente.service';
import { UsuarioService, Usuario } from '../../../services/usuario.service';

@Component({
  selector: 'app-lista-clientes',
  standalone: true,
  imports: [SharedModule, FormsModule, CommonModule],
  templateUrl: './lista-clientes.component.html',
  styleUrls: ['./lista-clientes.component.scss']
})
export class ListaClientesComponent implements OnInit, OnDestroy {
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  termoBusca: string = '';
  carregando: boolean = false;
  perfil: PerfilUsuario = 'USUARIO';
  usuarioId: string | null = null;
  usuarios: Usuario[] = [];
  selectedUsuarioId: string = '';
  private subscription: Subscription = new Subscription();

  constructor(
    private clienteService: ClienteService,
    private router: Router,
    private auth: AuthService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.perfil = this.auth.getPerfil();
    this.usuarioId = this.auth.getUsuarioId();
    this.carregarClientes();
    if (this.perfil === 'ADMINISTRATIVO') {
      this.carregarUsuarios();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  carregarClientes(): void {
    this.carregando = true;
    
    const clientesSub = this.clienteService.obterTodosClientes().subscribe({
      next: (clientes) => {
        this.clientes = clientes;
        this.aplicarFiltro();
        this.carregando = false;
      },
      error: (erro) => {
        console.error('Erro ao carregar clientes:', erro);
        this.carregando = false;
      }
    });

    this.subscription.add(clientesSub);
  }

  carregarUsuarios(): void {
    const sub = this.usuarioService.listarUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
      },
      error: (err) => {
        console.error('Erro ao carregar usuários:', err);
      }
    });
    this.subscription.add(sub);
  }

  aplicarFiltro(): void {
    const termo = this.termoBusca.trim();
    const base = termo ? this.clienteService.buscarClientes(termo) : [...this.clientes];
    if (this.perfil === 'ADMINISTRATIVO' && this.selectedUsuarioId) {
      this.clientesFiltrados = base.filter(c => (c.usuarioId || '') === this.selectedUsuarioId);
    } else {
      this.clientesFiltrados = base;
    }
  }

  onBuscar(): void {
    this.aplicarFiltro();
  }

  onAlterarUsuario(): void {
    this.aplicarFiltro();
  }

  novoCliente(): void {
    this.router.navigate(['/clientes/novo']);
  }

  editarCliente(id: string): void {
    this.router.navigate(['/clientes/editar', id]);
  }

  visualizarCliente(id: string): void {
    this.router.navigate(['/clientes/visualizar', id]);
  }

  excluirCliente(cliente: Cliente): void {
    const confirmacao = confirm(`Tem certeza que deseja excluir o cliente "${cliente.nomeCompleto}"?`);
    
    if (confirmacao && cliente.id) {
      this.carregando = true;
      const sub = this.clienteService.excluirCliente(cliente.id).subscribe({
        next: () => {
          console.log('Cliente excluído com sucesso');
          this.carregarClientes();
        },
        error: (err) => {
          console.error('Erro ao excluir cliente:', err);
          alert('Erro ao excluir cliente. Tente novamente.');
          this.carregando = false;
        }
      });
      this.subscription.add(sub);
    }
  }

  formatarCPF(cpf: string): string {
    return this.clienteService.formatarCPF(cpf);
  }

  formatarData(data: Date): string {
    if (!data) return '';
    return new Date(data).toLocaleDateString('pt-BR');
  }

  obterIdadeAproximada(dataNascimento: Date): number {
    if (!dataNascimento) return 0;
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();
    
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    return idade;
  }
}
