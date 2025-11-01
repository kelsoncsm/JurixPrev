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