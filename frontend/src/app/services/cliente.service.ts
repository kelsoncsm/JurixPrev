import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Cliente, DadosFormularioCliente, EstadoCivil } from '../models/cliente.model';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private clientes: Cliente[] = [];
  private clientesSubject = new BehaviorSubject<Cliente[]>([]);
  public clientes$ = this.clientesSubject.asObservable();
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    this.fetchClientes();
  }
  private fetchClientes(): void {
    this.http.get<Cliente[]>(`${this.baseUrl}/clientes`).subscribe({
      next: (clientes) => {
        // Normaliza datas
        this.clientes = clientes.map((c: any) => ({
          ...c,
          dataNascimento: c.dataNascimento ? new Date(c.dataNascimento) : undefined,
        }));
        this.clientesSubject.next(this.clientes);
      },
      error: (err) => {
        console.error('Erro ao buscar clientes no backend:', err);
      }
    });
  }

  obterTodosClientes(): Observable<Cliente[]> {
    // Atualiza cache e retorna observable
    this.fetchClientes();
    return this.clientes$;
  }

  obterClientePorId(id: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.baseUrl}/clientes/${id}`);
  }

  obterClientePorEmail(email: string): Observable<Cliente | undefined> {
    const alvo = email.toLowerCase();
    return this.http.get<Cliente[]>(`${this.baseUrl}/clientes`).pipe(
      map((lista) => lista.find((c) => (c.email || '').toLowerCase() === alvo))
    );
  }

  criarCliente(dadosFormulario: DadosFormularioCliente): Observable<Cliente> {
    // Converte dataNascimento para ISO
    const payload = { ...dadosFormulario } as any;
    if (payload.dataNascimento) {
      payload.dataNascimento = new Date(payload.dataNascimento).toISOString().split('T')[0];
    }
    return this.http.post<Cliente>(`${this.baseUrl}/clientes`, payload);
  }

  atualizarCliente(id: string, dadosFormulario: DadosFormularioCliente): Observable<Cliente> {
    const payload = { ...dadosFormulario } as any;
    if (payload.dataNascimento) {
      payload.dataNascimento = new Date(payload.dataNascimento).toISOString().split('T')[0];
    }
    return this.http.put<Cliente>(`${this.baseUrl}/clientes/${id}`, payload);
  }

  excluirCliente(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/clientes/${id}`);
  }

  buscarClientes(termo: string): Cliente[] {
    if (!termo.trim()) {
      return this.clientes;
    }

    const termoBusca = termo.toLowerCase();
    return this.clientes.filter(cliente =>
      cliente.nomeCompleto.toLowerCase().includes(termoBusca) ||
      (cliente.email && cliente.email.toLowerCase().includes(termoBusca)) ||
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
    // Mantido para compatibilizar com possíveis usos locais
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}