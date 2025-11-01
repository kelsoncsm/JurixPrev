import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

// project imports
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { DocumentoJuridicoService } from 'src/app/services/documento-juridico.service';
import {
  DocumentoJuridico,
  TipoDocumento,
  TomTexto,
  DadosFormulario
} from 'src/app/models/documento-juridico.model';

@Component({
  selector: 'app-gerar-documento',
  imports: [SharedModule],
  templateUrl: './gerar-documento.component.html',
  styleUrls: ['./gerar-documento.component.scss']
})
export class GerarDocumentoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Controle de abas
  abaAtiva = 'tipo';
  abas = [
    { id: 'tipo', titulo: 'Tipo', icone: 'fas fa-file-alt', ativa: true },
    { id: 'dados', titulo: 'Dados', icone: 'fas fa-user', ativa: false },
    { id: 'conteudo', titulo: 'Conteúdo', icone: 'fas fa-edit', ativa: false },
    { id: 'revisao', titulo: 'Revisão', icone: 'fas fa-check', ativa: false }
  ];
  
  // Formulários
  tipoForm!: FormGroup;
  dadosForm!: FormGroup;
  conteudoForm!: FormGroup;
  
  // Opções
  tiposDocumento = Object.values(TipoDocumento);
  tonsTexto = Object.values(TomTexto);
  
  // Estado
  carregando = false;
  gerandoIA = false;
  documentoId: string | null = null;
  modoEdicao = false;
  
  // Conteúdo gerado
  conteudoGerado = '';

  constructor(
    private fb: FormBuilder,
    private documentoService: DocumentoJuridicoService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.inicializarFormularios();
  }

  ngOnInit(): void {
    // Verificar se é edição
    this.documentoId = this.route.snapshot.paramMap.get('id');
    this.modoEdicao = !!this.documentoId;
    
    if (this.modoEdicao) {
      this.carregarDocumento();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private inicializarFormularios(): void {
    // Formulário da aba Tipo
    this.tipoForm = this.fb.group({
      tipoDocumento: ['', Validators.required],
      tomTexto: [TomTexto.TECNICO, Validators.required]
    });

    // Formulário da aba Dados
    this.dadosForm = this.fb.group({
      nomeCliente: ['', Validators.required],
      cpfCnpj: [''],
      endereco: [''],
      telefone: [''],
      email: ['', Validators.email],
      numeroProcesso: [''],
      vara: [''],
      comarca: [''],
      valorCausa: [''],
      fundamentosJuridicos: [''],
      pedidos: [''],
      observacoes: ['']
    });

    // Formulário da aba Conteúdo
    this.conteudoForm = this.fb.group({
      titulo: ['', Validators.required],
      conteudo: ['', Validators.required]
    });
  }

  private carregarDocumento(): void {
    if (!this.documentoId) return;
    
    this.carregando = true;
    this.documentoService.obterDocumentoPorId(this.documentoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (documento) => {
          if (documento) {
            this.preencherFormularios(documento);
          }
          this.carregando = false;
        },
        error: (error) => {
          console.error('Erro ao carregar documento:', error);
          this.carregando = false;
        }
      });
  }

  private preencherFormularios(documento: DocumentoJuridico): void {
    // Preencher formulário de tipo
    this.tipoForm.patchValue({
      tipoDocumento: documento.tipoDocumento,
      tomTexto: documento.tomTexto
    });

    // Preencher formulário de dados
    if (documento.dadosFormulario) {
      this.dadosForm.patchValue(documento.dadosFormulario);
    }

    // Preencher formulário de conteúdo
    this.conteudoForm.patchValue({
      titulo: documento.titulo,
      conteudo: documento.conteudo
    });

    this.conteudoGerado = documento.conteudo;
  }

  navegarParaAba(abaId: string): void {
    // Validar aba atual antes de navegar
    if (!this.validarAbaAtual()) {
      return;
    }

    this.abaAtiva = abaId;
    this.atualizarStatusAbas();
  }

  proximaAba(): void {
    const abaAtualIndex = this.abas.findIndex(aba => aba.id === this.abaAtiva);
    if (abaAtualIndex < this.abas.length - 1) {
      const proximaAba = this.abas[abaAtualIndex + 1];
      this.navegarParaAba(proximaAba.id);
    }
  }

  abaAnterior(): void {
    const abaAtualIndex = this.abas.findIndex(aba => aba.id === this.abaAtiva);
    if (abaAtualIndex > 0) {
      const abaAnterior = this.abas[abaAtualIndex - 1];
      this.navegarParaAba(abaAnterior.id);
    }
  }

  private validarAbaAtual(): boolean {
    switch (this.abaAtiva) {
      case 'tipo':
        if (this.tipoForm.invalid) {
          this.tipoForm.markAllAsTouched();
          return false;
        }
        break;
      case 'dados':
        if (this.dadosForm.invalid) {
          this.dadosForm.markAllAsTouched();
          return false;
        }
        break;
      case 'conteudo':
        if (this.conteudoForm.invalid) {
          this.conteudoForm.markAllAsTouched();
          return false;
        }
        break;
    }
    return true;
  }

  private atualizarStatusAbas(): void {
    const abaAtualIndex = this.abas.findIndex(aba => aba.id === this.abaAtiva);
    
    this.abas.forEach((aba, index) => {
      aba.ativa = index <= abaAtualIndex;
    });
  }

  gerarComIA(): void {
    if (!this.tipoForm.valid || !this.dadosForm.valid) {
      alert('Por favor, preencha os dados obrigatórios antes de gerar o documento.');
      return;
    }

    this.gerandoIA = true;
    const tipoDocumento = this.tipoForm.value.tipoDocumento;
    const tomTexto = this.tipoForm.value.tomTexto;
    const dadosFormulario = this.dadosForm.value;

    this.documentoService.gerarDocumentoComIA(tipoDocumento, tomTexto, dadosFormulario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conteudo) => {
          this.conteudoGerado = conteudo;
          
          // Atualizar formulário de conteúdo
          this.conteudoForm.patchValue({
            titulo: this.gerarTituloAutomatico(),
            conteudo: conteudo
          });
          
          // Navegar para aba de conteúdo
          this.navegarParaAba('conteudo');
          this.gerandoIA = false;
        },
        error: (error) => {
          console.error('Erro ao gerar documento com IA:', error);
          alert('Erro ao gerar documento. Tente novamente.');
          this.gerandoIA = false;
        }
      });
  }

  private gerarTituloAutomatico(): string {
    const tipo = this.tipoForm.value.tipoDocumento;
    const nomeCliente = this.dadosForm.value.nomeCliente;
    const numeroProcesso = this.dadosForm.value.numeroProcesso;
    
    let titulo = tipo;
    if (nomeCliente) {
      titulo += ` - ${nomeCliente}`;
    }
    if (numeroProcesso) {
      titulo += ` - Processo ${numeroProcesso}`;
    }
    
    return titulo;
  }

  salvarDocumento(): void {
    if (!this.validarTodosFormularios()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    this.carregando = true;
    
    const documentoData = {
      tipoDocumento: this.tipoForm.value.tipoDocumento,
      tomTexto: this.tipoForm.value.tomTexto,
      titulo: this.conteudoForm.value.titulo,
      conteudo: this.conteudoForm.value.conteudo,
      dadosFormulario: this.dadosForm.value,
      geradoPorIA: !!this.conteudoGerado
    };

    const operacao = this.modoEdicao 
      ? this.documentoService.atualizarDocumento(this.documentoId!, documentoData)
      : this.documentoService.criarDocumento(documentoData);

    operacao.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (documento) => {
          if (documento) {
            alert(this.modoEdicao ? 'Documento atualizado com sucesso!' : 'Documento criado com sucesso!');
            this.router.navigate(['/documentos']);
          }
          this.carregando = false;
        },
        error: (error) => {
          console.error('Erro ao salvar documento:', error);
          alert('Erro ao salvar documento. Tente novamente.');
          this.carregando = false;
        }
      });
  }

  private validarTodosFormularios(): boolean {
    const tipoValido = this.tipoForm.valid;
    const dadosValido = this.dadosForm.valid;
    const conteudoValido = this.conteudoForm.valid;

    if (!tipoValido) this.tipoForm.markAllAsTouched();
    if (!dadosValido) this.dadosForm.markAllAsTouched();
    if (!conteudoValido) this.conteudoForm.markAllAsTouched();

    return tipoValido && dadosValido && conteudoValido;
  }

  cancelar(): void {
    console.log('Método cancelar() chamado');
    const confirmacao = confirm('Tem certeza que deseja cancelar? Todas as alterações serão perdidas.');
    console.log('Resultado da confirmação:', confirmacao);
    
    if (confirmacao === true) {
      console.log('Navegando para /documentos');
      // Tentativa 1: Navegação Angular padrão
      this.router.navigate(['/documentos']).then(success => {
        console.log('Navegação Angular bem-sucedida:', success);
        if (!success) {
          console.log('Navegação Angular falhou, tentando window.location');
          // Tentativa 2: Usando window.location como fallback
          window.location.href = '/documentos';
        }
      }).catch(error => {
        console.error('Erro na navegação Angular:', error);
        // Tentativa 3: Forçar recarga da página na rota correta
        window.location.href = '/documentos';
      });
    } else {
      console.log('Cancelamento cancelado pelo usuário');
    }
  }

  // Getters para facilitar o acesso aos controles dos formulários
  get tipoControls() { return this.tipoForm.controls; }
  get dadosControls() { return this.dadosForm.controls; }
  get conteudoControls() { return this.conteudoForm.controls; }

  // Verificar se uma aba pode ser acessada
  podeAcessarAba(abaId: string): boolean {
    const abaIndex = this.abas.findIndex(aba => aba.id === abaId);
    const abaAtualIndex = this.abas.findIndex(aba => aba.id === this.abaAtiva);
    
    // Pode acessar abas anteriores ou a atual
    return abaIndex <= abaAtualIndex || this.abas[abaIndex].ativa;
  }
}