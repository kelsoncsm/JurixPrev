import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Cliente, DadosFormularioCliente, EstadoCivil } from '../models/cliente.model';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private clientes: Cliente[] = [];
  private clientesSubject = new BehaviorSubject<Cliente[]>([]);
  public clientes$ = this.clientesSubject.asObservable();

  constructor() {
    this.carregarClientesDoLocalStorage();
  }

  private carregarClientesDoLocalStorage(): void {
    const clientesSalvos = localStorage.getItem('clientes');
    if (clientesSalvos) {
      this.clientes = JSON.parse(clientesSalvos).map((cliente: any) => ({
        ...cliente,
        dataNascimento: new Date(cliente.dataNascimento),
        dataCriacao: cliente.dataCriacao ? new Date(cliente.dataCriacao) : undefined,
        dataAtualizacao: cliente.dataAtualizacao ? new Date(cliente.dataAtualizacao) : undefined
      }));
      this.clientesSubject.next(this.clientes);
    }
  }

  private salvarClientesNoLocalStorage(): void {
    localStorage.setItem('clientes', JSON.stringify(this.clientes));
  }

  obterTodosClientes(): Observable<Cliente[]> {
    return this.clientes$;
  }

  obterClientePorId(id: string): Cliente | undefined {
    return this.clientes.find(cliente => cliente.id === id);
  }

  criarCliente(dadosFormulario: DadosFormularioCliente): Cliente {
    const novoCliente: Cliente = {
      id: this.gerarId(),
      nomeCompleto: dadosFormulario.nomeCompleto,
      estadoCivil: dadosFormulario.estadoCivil,
      profissao: dadosFormulario.profissao,
      cpf: dadosFormulario.cpf,
      rg: dadosFormulario.rg,
      orgaoExpedidor: dadosFormulario.orgaoExpedidor,
      nit: dadosFormulario.nit,
      numeroBeneficio: dadosFormulario.numeroBeneficio,
      dataNascimento: new Date(dadosFormulario.dataNascimento),
      nomeMae: dadosFormulario.nomeMae,
      nomePai: dadosFormulario.nomePai,
      endereco: dadosFormulario.endereco,
      bairro: dadosFormulario.bairro,
      cidade: dadosFormulario.cidade,
      uf: dadosFormulario.uf,
      dataCriacao: new Date(),
      dataAtualizacao: new Date()
    };

    this.clientes.push(novoCliente);
    this.salvarClientesNoLocalStorage();
    this.clientesSubject.next(this.clientes);
    
    return novoCliente;
  }

  atualizarCliente(id: string, dadosFormulario: DadosFormularioCliente): Cliente | null {
    const indice = this.clientes.findIndex(cliente => cliente.id === id);
    
    if (indice === -1) {
      return null;
    }

    const clienteAtualizado: Cliente = {
      ...this.clientes[indice],
      nomeCompleto: dadosFormulario.nomeCompleto,
      estadoCivil: dadosFormulario.estadoCivil,
      profissao: dadosFormulario.profissao,
      cpf: dadosFormulario.cpf,
      rg: dadosFormulario.rg,
      orgaoExpedidor: dadosFormulario.orgaoExpedidor,
      nit: dadosFormulario.nit,
      numeroBeneficio: dadosFormulario.numeroBeneficio,
      dataNascimento: new Date(dadosFormulario.dataNascimento),
      nomeMae: dadosFormulario.nomeMae,
      nomePai: dadosFormulario.nomePai,
      endereco: dadosFormulario.endereco,
      bairro: dadosFormulario.bairro,
      cidade: dadosFormulario.cidade,
      uf: dadosFormulario.uf,
      dataAtualizacao: new Date()
    };

    this.clientes[indice] = clienteAtualizado;
    this.salvarClientesNoLocalStorage();
    this.clientesSubject.next(this.clientes);
    
    return clienteAtualizado;
  }

  excluirCliente(id: string): boolean {
    const indiceInicial = this.clientes.length;
    this.clientes = this.clientes.filter(cliente => cliente.id !== id);
    
    if (this.clientes.length < indiceInicial) {
      this.salvarClientesNoLocalStorage();
      this.clientesSubject.next(this.clientes);
      return true;
    }
    
    return false;
  }

  buscarClientes(termo: string): Cliente[] {
    if (!termo.trim()) {
      return this.clientes;
    }

    const termoBusca = termo.toLowerCase();
    return this.clientes.filter(cliente =>
      cliente.nomeCompleto.toLowerCase().includes(termoBusca) ||
      cliente.cpf.includes(termoBusca) ||
      cliente.rg.includes(termoBusca) ||
      cliente.profissao.toLowerCase().includes(termoBusca) ||
      cliente.cidade.toLowerCase().includes(termoBusca)
    );
  }

  obterEstadosCivis(): EstadoCivil[] {
    return Object.values(EstadoCivil);
  }

  validarCPF(cpf: string): boolean {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validação do primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    
    // Validação do segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;
    
    return true;
  }

  formatarCPF(cpf: string): string {
    cpf = cpf.replace(/[^\d]/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  private gerarId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}