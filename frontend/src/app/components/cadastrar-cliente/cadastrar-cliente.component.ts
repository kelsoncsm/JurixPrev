import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Cliente, DadosFormularioCliente, EstadoCivil } from '../../models/cliente.model';
import { ClienteService } from '../../services/cliente.service';
import { BrandingService } from '../../services/branding.service';

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
  logoPreview: string | null = null;
  
  private subscription: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private branding: BrandingService,
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
      email: ['', [Validators.required, Validators.email]],
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
      uf: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
      logoUrl: ['']
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
    const sub = this.clienteService.obterClientePorId(this.clienteId).subscribe({
      next: (cliente) => {
        this.preencherFormulario(cliente);
        this.carregando = false;
      },
      error: () => {
        alert('Cliente não encontrado!');
        this.router.navigate(['/clientes']);
        this.carregando = false;
      }
    });
    this.subscription.add(sub);
  }

  private preencherFormulario(cliente: Cliente): void {
    const dataFormatada = this.formatarDataParaInput(cliente.dataNascimento);
    
    this.formularioCliente.patchValue({
      nomeCompleto: cliente.nomeCompleto,
      email: cliente.email,
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
      uf: cliente.uf.toUpperCase(),
      logoUrl: cliente.logoUrl || ''
    });

    this.logoPreview = cliente.logoUrl || null;
    if (cliente.logoUrl && cliente.logoUrl.trim()) {
      this.branding.setLogo(cliente.logoUrl);
    }
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
          const sub = this.clienteService.atualizarCliente(this.clienteId, dadosFormulario).subscribe({
            next: () => {
              this.branding.setLogo(dadosFormulario.logoUrl);
              alert('Cliente atualizado com sucesso!');
              this.router.navigate(['/clientes']);
            },
            error: (err) => {
              console.error('Erro ao atualizar cliente:', err);
              alert('Erro ao atualizar cliente. Tente novamente.');
            }
          });
          this.subscription.add(sub);
        } else {
          const sub = this.clienteService.criarCliente(dadosFormulario).subscribe({
            next: () => {
              this.branding.setLogo(dadosFormulario.logoUrl);
              alert('Cliente cadastrado com sucesso!');
              this.router.navigate(['/clientes']);
            },
            error: (err) => {
              console.error('Erro ao cadastrar cliente:', err);
              alert('Erro ao cadastrar cliente. Tente novamente.');
            }
          });
          this.subscription.add(sub);
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
    const houveAlteracoes = this.formularioCliente?.dirty === true;

    if (houveAlteracoes) {
      const confirmacao = confirm('Você possui alterações não salvas. Sair pode causar perda de dados. Deseja continuar?');
      if (!confirmacao) {
        return;
      }
    }

    try {
      this.router.navigate(['/clientes']).then(
        () => {},
        () => {
          window.location.href = '/clientes';
        }
      );
    } catch {
      window.location.href = '/clientes';
    }
  }

  obterMensagemErro(campo: string): string {
    const controle = this.formularioCliente.get(campo);
    
    if (controle?.errors && controle.touched) {
      if (controle.errors['required']) {
        return 'Este campo é obrigatório';
      }
      if (controle.errors['email']) {
        return 'E-mail inválido';
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

  onLogoSelected(event: any): void {
    const file: File | undefined = event?.target?.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.logoPreview = dataUrl;
      this.formularioCliente.patchValue({ logoUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  }

  removerLogo(): void {
    this.logoPreview = null;
    this.formularioCliente.patchValue({ logoUrl: '' });
    this.branding.resetLogo();
  }
}
