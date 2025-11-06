import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';

// project imports
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { DocumentoJuridicoService } from 'src/app/services/documento-juridico.service';
import {
  DocumentoJuridico,
  TipoDocumento,
  StatusDocumento,
  FiltroDocumento,
  ResultadoPaginado
} from 'src/app/models/documento-juridico.model';

@Component({
  selector: 'app-lista-documentos',
  imports: [SharedModule],
  templateUrl: './lista-documentos.component.html',
  styleUrls: ['./lista-documentos.component.scss']
})
export class ListaDocumentosComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  documentos: DocumentoJuridico[] = [];
  resultadoPaginado: ResultadoPaginado<DocumentoJuridico> | null = null;
  carregando = false;
  
  // Formulário de filtros
  filtroForm: FormGroup;
  
  // Expor Math para o template
  Math = Math;
  
  // Opções para os selects
  tiposDocumento = Object.values(TipoDocumento);
  statusDocumento = Object.values(StatusDocumento);
  
  // Paginação
  paginaAtual = 1;
  itensPorPagina = 10;
  opcoesItensPorPagina = [5, 10, 20, 50];

  constructor(
    private documentoService: DocumentoJuridicoService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.filtroForm = this.fb.group({
      termo: [''],
      tipoDocumento: [''],
      status: [''],
      dataInicio: [''],
      dataFim: ['']
    });
  }

  ngOnInit(): void {
    this.carregarDocumentos();
    this.configurarFiltros();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private configurarFiltros(): void {
    // Aplicar filtros automaticamente quando houver mudanças
    this.filtroForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.paginaAtual = 1; // Reset para primeira página
        this.carregarDocumentos();
      });
  }

  carregarDocumentos(): void {
    this.carregando = true;
    
    const filtro: FiltroDocumento = {};
    const formValue = this.filtroForm.value;
    
    if (formValue.termo?.trim()) {
      filtro.termo = formValue.termo.trim();
    }
    if (formValue.tipoDocumento) {
      filtro.tipoDocumento = formValue.tipoDocumento;
    }
    if (formValue.status) {
      filtro.status = formValue.status;
    }
    if (formValue.dataInicio) {
      filtro.dataInicio = new Date(formValue.dataInicio);
    }
    if (formValue.dataFim) {
      filtro.dataFim = new Date(formValue.dataFim);
    }

    this.documentoService.listarDocumentos(filtro, this.paginaAtual, this.itensPorPagina)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resultado) => {
          this.resultadoPaginado = resultado;
          this.documentos = resultado.itens;
          this.carregando = false;
        },
        error: (error) => {
          console.error('Erro ao carregar documentos:', error);
          this.carregando = false;
        }
      });
  }

  onPaginaChange(pagina: number): void {
    this.paginaAtual = pagina;
    this.carregarDocumentos();
  }

  onItensPorPaginaChange(itens: number): void {
    this.itensPorPagina = itens;
    this.paginaAtual = 1;
    this.carregarDocumentos();
  }

  limparFiltros(): void {
    this.filtroForm.reset();
    this.paginaAtual = 1;
    this.carregarDocumentos();
  }

  novoDocumento(): void {
    this.router.navigate(['/documentos/novo']);
  }

  editarDocumento(documento: DocumentoJuridico): void {
    this.router.navigate(['/documentos/editar', documento.id]);
  }

  visualizarDocumento(documento: DocumentoJuridico): void {
    this.router.navigate(['/documentos/visualizar', documento.id]);
  }

  excluirDocumento(documento: DocumentoJuridico): void {
    if (confirm(`Tem certeza que deseja excluir o documento "${documento.titulo}"?`)) {
      this.carregando = true;
      this.documentoService.excluirDocumento(documento.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (sucesso) => {
            if (sucesso) {
              this.carregarDocumentos();
            }
          },
          error: (error) => {
            console.error('Erro ao excluir documento:', error);
            this.carregando = false;
          }
        });
    }
  }

  // Download helpers (Word/PDF) a partir do item da lista
  baixarWord(documento: DocumentoJuridico): void {
    const titulo = (documento.titulo || 'Documento').toString().trim() || 'Documento';
    const conteudo = (documento.conteudo || '').toString();
    const html = this.montarHTMLDocumento(titulo, conteudo, documento);
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.sanitizarNomeArquivo(titulo)}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  }

  baixarPDF(documento: DocumentoJuridico): void {
    const titulo = (documento.titulo || 'Documento').toString().trim() || 'Documento';
    const conteudo = (documento.conteudo || '').toString();
    const html = this.montarHTMLDocumento(titulo, conteudo, documento, true);
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

  private montarHTMLDocumento(titulo: string, conteudo: string, documento: DocumentoJuridico, modoImpressao: boolean = false): string {
    const dados: any = documento.dadosFormulario || {};
    const tipo = documento.tipoDocumento || '';
    const tom = documento.tomTexto || '';
    const imagemUrl = (documento as any)?.imagemUrl || '';
    const corpoHtml = this.formatarConteudoParaHTML(conteudo);
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
          <div><strong>Cliente:</strong> ${this.escapeHtml(dados?.nomeCliente || '')}</div>
          ${dados?.cpfCnpj ? `<div><strong>CPF/CNPJ:</strong> ${this.escapeHtml(dados.cpfCnpj)}</div>` : ''}
          ${dados?.email ? `<div><strong>E-mail:</strong> ${this.escapeHtml(dados.email)}</div>` : ''}
          ${dados?.numeroProcesso ? `<div><strong>Processo:</strong> ${this.escapeHtml(dados.numeroProcesso)}</div>` : ''}
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
    const linhas = (texto || '').split(/\r?\n/).map(l => this.escapeHtml(l));
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
    return (nome || 'documento')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_ ]/g, '')
      .replace(/\s+/g, '-');
  }

  getClasseStatus(status: StatusDocumento): string {
    const classes: Record<string, string> = {
      [StatusDocumento.RASCUNHO]: 'text-warning',
      [StatusDocumento.FINALIZADO]: 'text-success',
      [StatusDocumento.ARQUIVADO]: 'text-secondary',
      [StatusDocumento.EM_REVISAO]: 'text-danger',
      
    };
    return classes[status] || 'text-dark';
  }

  getClasseTipo(tipo: TipoDocumento): string {
    const classes: Record<string, string> = {
      [TipoDocumento.PETICAO_INICIAL]: 'text-primary',
      [TipoDocumento.RECURSO_INOMINADO]: 'text-info',
      [TipoDocumento.PROCURACAO]: 'text-success',
      [TipoDocumento.CONTRATO_HONORARIOS]: 'text-warning',
      [TipoDocumento.REQUERIMENTO_ADMINISTRATIVO]: 'text-secondary',
      [TipoDocumento.RECURSO_ADMINISTRATIVO]: 'text-info',
      [TipoDocumento.REPLICA]: 'text-primary',
      [TipoDocumento.IMPUGNACAO]: 'text-danger',
      [TipoDocumento.MANIFESTACAO]: 'text-info',
      [TipoDocumento.MANDADO_SEGURANCA]: 'text-warning',
      [TipoDocumento.EMBARGOS_DECLARACAO]: 'text-secondary'
    };
    return classes[tipo] || 'text-dark';
  }

  formatarData(data: Date): string {
    return new Date(data).toLocaleDateString('pt-BR');
  }

  getPaginasArray(): number[] {
    if (!this.resultadoPaginado) return [];
    
    const totalPaginas = this.resultadoPaginado.paginacao.totalPaginas;
    const paginaAtual = this.resultadoPaginado.paginacao.pagina;
    const paginas: number[] = [];
    
    // Mostrar no máximo 5 páginas
    const maxPaginas = 5;
    let inicio = Math.max(1, paginaAtual - Math.floor(maxPaginas / 2));
    const fim = Math.min(totalPaginas, inicio + maxPaginas - 1);
    
    // Ajustar início se necessário
    if (fim - inicio + 1 < maxPaginas) {
      inicio = Math.max(1, fim - maxPaginas + 1);
    }
    
    for (let i = inicio; i <= fim; i++) {
      paginas.push(i);
    }
    
    return paginas;
  }
}