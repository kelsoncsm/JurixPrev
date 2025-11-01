import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Cliente, DadosFormularioCliente, EstadoCivil } from '../../models/cliente.model';
import { ClienteService } from '../../services/cliente.service';

@Component({
  selector: 'app-cadastrar-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cadastrar-cliente.component.html',
  styleUrls: ['./cadastrar-cliente.component.scss']
})
export class CadastrarClienteComponent implements OnInit, OnDestroy {
  formularioCliente: FormGroup;
  modoEdicao: boolean = false;
  modoVisualizacao: boolean = false;
  clienteId: string | null = null;
  carregando: boolean = false;
  salvando: boolean = false;
  estadosCivis = Object.values(EstadoCivil);
  
  private subscription: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.formularioCliente = this.criarFormulario();
  }

  ngOnInit(): void {
    this.verificarModoOperacao();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private criarFormulario(): FormGroup {
    return this.fb.group({
      nomeCompleto: ['', [Validators.required, Validators.minLength(2)]],
      estadoCivil: ['', Validators.required],
      profissao: ['', [Validators.required, Validators.minLength(2)]],
      cpf: ['', [Validators.required, this.validadorCPF.bind(this)]],
      rg: ['', [Validators.required, Validators.minLength(4)]],
      orgaoExpedidor: ['', [Validators.required, Validators.minLength(2)]],
      nit: ['', [Validators.required, Validators.minLength(8)]],
      numeroBeneficio: ['', [Validators.required, Validators.minLength(5)]],
      dataNascimento: ['', Validators.required],
      nomeMae: ['', [Validators.required, Validators.minLength(2)]],
      nomePai: ['', [Validators.required, Validators.minLength(2)]],
      endereco: ['', [Validators.required, Validators.minLength(5)]],
      bairro: ['', [Validators.required, Validators.minLength(2)]],
      cidade: ['', [Validators.required, Validators.minLength(2)]],
      uf: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]]
    });
  }

  private verificarModoOperacao(): void {
    const url = this.router.url;
    
    if (url.includes('/visualizar/')) {
      this.modoVisualizacao = true;
      this.formularioCliente.disable();
    } else if (url.includes('/editar/')) {
      this.modoEdicao = true;
    }

    // Obter ID do cliente se estiver editando ou visualizando
    const paramsSub = this.route.params.subscribe(params => {
      if (params['id']) {
        this.clienteId = params['id'];
        this.carregarCliente();
      }
    });

    this.subscription.add(paramsSub);
  }

  private carregarCliente(): void {
    if (!this.clienteId) return;

    this.carregando = true;
    const cliente = this.clienteService.obterClientePorId(this.clienteId);

    if (cliente) {
      this.preencherFormulario(cliente);
      this.carregando = false;
    } else {
      alert('Cliente não encontrado!');
      this.router.navigate(['/clientes']);
    }
  }

  private preencherFormulario(cliente: Cliente): void {
    const dataFormatada = this.formatarDataParaInput(cliente.dataNascimento);
    
    this.formularioCliente.patchValue({
      nomeCompleto: cliente.nomeCompleto,
      estadoCivil: cliente.estadoCivil,
      profissao: cliente.profissao,
      cpf: cliente.cpf,
      rg: cliente.rg,
      orgaoExpedidor: cliente.orgaoExpedidor,
      nit: cliente.nit,
      numeroBeneficio: cliente.numeroBeneficio,
      dataNascimento: dataFormatada,
      nomeMae: cliente.nomeMae,
      nomePai: cliente.nomePai,
      endereco: cliente.endereco,
      bairro: cliente.bairro,
      cidade: cliente.cidade,
      uf: cliente.uf.toUpperCase()
    });
  }

  private formatarDataParaInput(data: Date): string {
    if (!data) return '';
    const dataObj = new Date(data);
    return dataObj.toISOString().split('T')[0];
  }

  private validadorCPF(control: any) {
    if (!control.value) return null;
    
    const cpfValido = this.clienteService.validarCPF(control.value);
    return cpfValido ? null : { cpfInvalido: true };
  }

  onCPFChange(event: any): void {
    let cpf = event.target.value.replace(/[^\d]/g, '');
    
    if (cpf.length <= 11) {
      const cpfFormatado = this.clienteService.formatarCPF(cpf);
      this.formularioCliente.patchValue({ cpf: cpfFormatado });
    }
  }

  onUFChange(event: any): void {
    const uf = event.target.value.toUpperCase();
    this.formularioCliente.patchValue({ uf: uf });
  }

  obterTituloTela(): string {
    if (this.modoVisualizacao) return 'Visualizar Cliente';
    if (this.modoEdicao) return 'Editar Cliente';
    return 'Cadastrar Cliente';
  }

  obterTextoBotao(): string {
    if (this.modoVisualizacao) return 'Editar';
    if (this.modoEdicao) return 'Atualizar Cliente';
    return 'Cadastrar Cliente';
  }

  onSubmit(): void {
    if (this.modoVisualizacao) {
      this.router.navigate(['/clientes/editar', this.clienteId]);
      return;
    }

    if (this.formularioCliente.valid) {
      this.salvando = true;
      
      const dadosFormulario: DadosFormularioCliente = this.formularioCliente.value;
      
      try {
        if (this.modoEdicao && this.clienteId) {
          const clienteAtualizado = this.clienteService.atualizarCliente(this.clienteId, dadosFormulario);
          
          if (clienteAtualizado) {
            alert('Cliente atualizado com sucesso!');
            this.router.navigate(['/clientes']);
          } else {
            alert('Erro ao atualizar cliente. Tente novamente.');
          }
        } else {
          const novoCliente = this.clienteService.criarCliente(dadosFormulario);
          
          if (novoCliente) {
            alert('Cliente cadastrado com sucesso!');
            this.router.navigate(['/clientes']);
          } else {
            alert('Erro ao cadastrar cliente. Tente novamente.');
          }
        }
      } catch (erro) {
        console.error('Erro ao salvar cliente:', erro);
        alert('Erro ao salvar cliente. Tente novamente.');
      } finally {
        this.salvando = false;
      }
    } else {
      this.marcarCamposComoTocados();
      alert('Por favor, preencha todos os campos obrigatórios corretamente.');
    }
  }

  private marcarCamposComoTocados(): void {
    Object.keys(this.formularioCliente.controls).forEach(campo => {
      this.formularioCliente.get(campo)?.markAsTouched();
    });
  }

  cancelar(): void {
    console.log('Método cancelar chamado');
    
    const confirmacao = confirm('Tem certeza que deseja cancelar? Todas as alterações serão perdidas.');
    console.log('Confirmação do usuário:', confirmacao);
    
    if (confirmacao === true) {
      console.log('Usuário confirmou cancelamento, navegando para /clientes');
      
      try {
        // Tentativa 1: Navegação Angular padrão
        this.router.navigate(['/clientes']).then(
          (sucesso) => {
            console.log('Navegação Angular bem-sucedida:', sucesso);
          },
          (erro) => {
            console.error('Erro na navegação Angular:', erro);
            // Fallback: usar window.location
            console.log('Usando fallback window.location.href');
            window.location.href = '/clientes';
          }
        );
      } catch (erro) {
        console.error('Erro ao tentar navegar:', erro);
        // Fallback final
        console.log('Usando fallback final window.location.href');
        window.location.href = '/clientes';
      }
    } else {
      console.log('Usuário cancelou a operação');
    }
  }

  obterMensagemErro(campo: string): string {
    const controle = this.formularioCliente.get(campo);
    
    if (controle?.errors && controle.touched) {
      if (controle.errors['required']) {
        return 'Este campo é obrigatório';
      }
      if (controle.errors['minlength']) {
        return `Mínimo de ${controle.errors['minlength'].requiredLength} caracteres`;
      }
      if (controle.errors['maxlength']) {
        return `Máximo de ${controle.errors['maxlength'].requiredLength} caracteres`;
      }
      if (controle.errors['cpfInvalido']) {
        return 'CPF inválido';
      }
    }
    
    return '';
  }

  campoTemErro(campo: string): boolean {
    const controle = this.formularioCliente.get(campo);
    return !!(controle?.errors && controle.touched);
  }
}
