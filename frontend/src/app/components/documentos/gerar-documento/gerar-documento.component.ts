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
      conteudo: ['', Validators.required],
      imagemUrl: ['']
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
      conteudo: documento.conteudo,
      imagemUrl: (documento as any).imagemUrl || ''
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
        next: (resp) => {
          this.conteudoGerado = resp.conteudo;
          // Preencher automaticamente campos específicos, se retornados
          const patchDados: any = {};
          if (resp.fundamentosJuridicos) patchDados.fundamentosJuridicos = resp.fundamentosJuridicos;
          if (resp.pedidos) patchDados.pedidos = resp.pedidos;
          if (resp.observacoes) patchDados.observacoes = resp.observacoes;
          if (Object.keys(patchDados).length) {
            this.dadosForm.patchValue(patchDados);
          }
          
          // Atualizar formulário de conteúdo
          this.conteudoForm.patchValue({
            titulo: this.gerarTituloAutomatico(),
            conteudo: resp.conteudo
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

  // Exportação: Word (.doc) via HTML
  baixarComoWord(): void {
    const titulo = (this.conteudoForm.value.titulo || 'Documento').toString().trim() || 'Documento';
    const conteudo = (this.conteudoForm.value.conteudo || this.conteudoGerado || '').toString();
    const html = this.montarHTMLDocumento(titulo, conteudo);
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.sanitizarNomeArquivo(titulo)}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Exportação: PDF usando janela de impressão do navegador
  baixarComoPDF(): void {
    const titulo = (this.conteudoForm.value.titulo || 'Documento').toString().trim() || 'Documento';
    const conteudo = (this.conteudoForm.value.conteudo || this.conteudoGerado || '').toString();
    const html = this.montarHTMLDocumento(titulo, conteudo, true);
    const win = window.open('', '_blank');
    if (!win) {
      alert('Não foi possível abrir a janela de impressão. Verifique o bloqueio de pop-ups.');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      try { win.print(); } catch {}
    }, 300);
  }

  private montarHTMLDocumento(titulo: string, conteudo: string, modoImpressao: boolean = false): string {
    const cliente = this.dadosForm.value || {} as DadosFormulario;
    const tipo = this.tipoForm.value?.tipoDocumento || '';
    const tom = this.tipoForm.value?.tomTexto || '';
    const corpoHtml = this.formatarConteudoParaHTML(conteudo);
    const imagemUrl = (this.conteudoForm.value as any)?.imagemUrl || '';
    const estilos = `
      <style>
        body { font-family: Arial, Helvetica, sans-serif; line-height: 1.5; color: #000; }
        .doc-container { max-width: 800px; margin: 0 auto; padding: 24px; }
        .doc-header { border-bottom: 2px solid #333; margin-bottom: 16px; padding-bottom: 8px; }
        .doc-logo { display: flex; align-items: center; gap: 12px; }
        .doc-logo img { max-height: 80px; max-width: 200px; object-fit: contain; }
        .doc-meta { font-size: 12px; color: #555; margin-top: 4px; }
        .doc-title { font-size: 22px; font-weight: bold; margin: 16px 0; }
        .doc-content { font-size: 14px; white-space: normal; }
        .doc-content p { margin: 0 0 12px; }
        .doc-content br { line-height: 1.2; }
        ${modoImpressao ? '@page { margin: 20mm; }' : ''}
      </style>
    `;
    const cabecalho = `
      <div class="doc-header">
        ${imagemUrl ? `<div class="doc-logo"><img src="${this.escapeHtml(imagemUrl)}" alt="Imagem do Documento" /></div>` : ''}
        <div><strong>Tipo:</strong> ${this.escapeHtml(tipo)} | <strong>Tom:</strong> ${this.escapeHtml(tom)}</div>
        <div class="doc-meta">
          <div><strong>Cliente:</strong> ${this.escapeHtml(cliente?.nomeCliente || '')}</div>
          ${cliente?.cpfCnpj ? `<div><strong>CPF/CNPJ:</strong> ${this.escapeHtml(cliente.cpfCnpj)}</div>` : ''}
          ${cliente?.email ? `<div><strong>E-mail:</strong> ${this.escapeHtml(cliente.email)}</div>` : ''}
          ${cliente?.numeroProcesso ? `<div><strong>Processo:</strong> ${this.escapeHtml(cliente.numeroProcesso)}</div>` : ''}
        </div>
      </div>
    `;
    return `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${this.escapeHtml(titulo)}</title>
          ${estilos}
        </head>
        <body>
          <div class="doc-container">
            ${cabecalho}
            <div class="doc-title">${this.escapeHtml(titulo)}</div>
            <div class="doc-content">${corpoHtml}</div>
          </div>
        </body>
      </html>`;
  }

  private formatarConteudoParaHTML(texto: string): string {
    const linhas = texto.split(/\r?\n/).map(l => this.escapeHtml(l));
    const blocos = linhas.map(l => l.trim().length ? `<p>${l}</p>` : '<br>');
    return blocos.join('');
  }

  private escapeHtml(valor: string): string {
    return (valor || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private sanitizarNomeArquivo(nome: string): string {
    return nome
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_ ]/g, '')
      .replace(/\s+/g, '-');
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
      imagemUrl: (this.conteudoForm.value as any)?.imagemUrl || '',
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
    const houveAlteracoes = (this.tipoForm?.dirty === true) || (this.dadosForm?.dirty === true) || (this.conteudoForm?.dirty === true);

    if (houveAlteracoes) {
      const confirmacao = confirm('Você possui alterações não salvas. Sair pode causar perda de dados. Deseja continuar?');
      if (!confirmacao) {
        return;
      }
    }

    this.router.navigate(['/documentos']).then(
      (success) => {
        if (!success) {
          window.location.href = '/documentos';
        }
      },
      () => {
        window.location.href = '/documentos';
      }
    ).catch(() => {
      window.location.href = '/documentos';
    });
  }

  // Getters para facilitar o acesso aos controles dos formulários
  get tipoControls() { return this.tipoForm.controls; }
  get dadosControls() { return this.dadosForm.controls; }
  get conteudoControls() { return this.conteudoForm.controls; }

  // Selecionar imagem e converter para Data URL
  onImagemSelecionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.conteudoForm.patchValue({ imagemUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  }

  // Verificar se uma aba pode ser acessada
  podeAcessarAba(abaId: string): boolean {
    const abaIndex = this.abas.findIndex(aba => aba.id === abaId);
    const abaAtualIndex = this.abas.findIndex(aba => aba.id === this.abaAtiva);
    
    // Pode acessar abas anteriores ou a atual
    return abaIndex <= abaAtualIndex || this.abas[abaIndex].ativa;
  }
}