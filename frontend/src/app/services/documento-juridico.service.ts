import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  DocumentoJuridico,
  TipoDocumento,
  TomTexto,
  StatusDocumento,
  FiltroDocumento,
  ResultadoPaginado,
  DadosFormulario
} from '../models/documento-juridico.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentoJuridicoService {
  private documentos: DocumentoJuridico[] = [];
  private documentosSubject = new BehaviorSubject<DocumentoJuridico[]>([]);
  private baseUrl = `${environment.apiUrl}/documentos`;

  constructor(private http: HttpClient) {}

  listarDocumentos(filtro?: FiltroDocumento, pagina: number = 1, itensPorPagina: number = 10): Observable<ResultadoPaginado<DocumentoJuridico>> {
    return this.http.get<DocumentoJuridico[]>(this.baseUrl).pipe(
      map(docs => {
        // normalizar datas
        const normalizados = docs.map(d => ({
          ...d,
          dataCreacao: new Date(d.dataCreacao),
          dataUltimaEdicao: new Date(d.dataUltimaEdicao)
        }));
        this.documentos = normalizados;
        this.documentosSubject.next(this.documentos);
        let documentosFiltrados = [...normalizados];

        // Aplicar filtros
        if (filtro) {
          if (filtro.tipoDocumento) {
            documentosFiltrados = documentosFiltrados.filter(doc => doc.tipoDocumento === filtro.tipoDocumento);
          }
          if (filtro.status) {
            documentosFiltrados = documentosFiltrados.filter(doc => doc.status === filtro.status);
          }
          if (filtro.termo) {
            const termo = filtro.termo.toLowerCase();
            documentosFiltrados = documentosFiltrados.filter(doc => 
              doc.titulo.toLowerCase().includes(termo) ||
              doc.conteudo.toLowerCase().includes(termo)
            );
          }
          if (filtro.dataInicio) {
            documentosFiltrados = documentosFiltrados.filter(doc => doc.dataCreacao >= filtro.dataInicio!);
          }
          if (filtro.dataFim) {
            documentosFiltrados = documentosFiltrados.filter(doc => doc.dataCreacao <= filtro.dataFim!);
          }
        }

        // Ordenar por data de criação (mais recente primeiro)
        documentosFiltrados.sort((a, b) => b.dataCreacao.getTime() - a.dataCreacao.getTime());

        // Aplicar paginação
        const totalItens = documentosFiltrados.length;
        const totalPaginas = Math.ceil(totalItens / itensPorPagina);
        const inicio = (pagina - 1) * itensPorPagina;
        const fim = inicio + itensPorPagina;
        const itens = documentosFiltrados.slice(inicio, fim);

        return {
          itens,
          paginacao: {
            pagina,
            itensPorPagina,
            totalItens,
            totalPaginas
          }
        };
      })
    );
  }

  obterDocumentoPorId(id: string): Observable<DocumentoJuridico | null> {
    return this.http.get<DocumentoJuridico>(`${this.baseUrl}/${id}`).pipe(
      map(d => ({
        ...d,
        dataCreacao: new Date(d.dataCreacao),
        dataUltimaEdicao: new Date(d.dataUltimaEdicao)
      }))
    );
  }

  criarDocumento(documento: Partial<DocumentoJuridico>): Observable<DocumentoJuridico> {
    const payload = {
      tipoDocumento: documento.tipoDocumento!,
      titulo: documento.titulo || 'Novo Documento',
      tomTexto: documento.tomTexto || TomTexto.TECNICO,
      conteudo: documento.conteudo || '',
      status: StatusDocumento.RASCUNHO,
      dataCreacao: new Date().toISOString().substring(0, 10),
      dataUltimaEdicao: new Date().toISOString().substring(0, 10),
      geradoPorIA: false,
      dadosFormulario: documento.dadosFormulario || null,
      imagemUrl: documento.imagemUrl || null
    };
    return this.http.post<DocumentoJuridico>(this.baseUrl, payload).pipe(
      map(d => ({
        ...d,
        dataCreacao: new Date(d.dataCreacao),
        dataUltimaEdicao: new Date(d.dataUltimaEdicao)
      }))
    );
  }

  atualizarDocumento(id: string, documento: Partial<DocumentoJuridico>): Observable<DocumentoJuridico | null> {
    const docAtual = this.documentos.find(doc => doc.id === id);
    const payload = {
      tipoDocumento: documento.tipoDocumento ?? docAtual?.tipoDocumento ?? TipoDocumento.PETICAO_INICIAL,
      titulo: documento.titulo ?? docAtual?.titulo ?? 'Documento',
      tomTexto: documento.tomTexto ?? docAtual?.tomTexto ?? TomTexto.TECNICO,
      conteudo: documento.conteudo ?? docAtual?.conteudo ?? '',
      status: documento.status ?? docAtual?.status ?? StatusDocumento.RASCUNHO,
      dataCreacao: (docAtual?.dataCreacao || new Date()).toISOString().substring(0, 10),
      dataUltimaEdicao: new Date().toISOString().substring(0, 10),
      geradoPorIA: documento.geradoPorIA ?? docAtual?.geradoPorIA ?? false,
      dadosFormulario: documento.dadosFormulario ?? docAtual?.dadosFormulario ?? null,
      imagemUrl: documento.imagemUrl ?? docAtual?.imagemUrl ?? null
    };
    return this.http.put<DocumentoJuridico>(`${this.baseUrl}/${id}`, payload).pipe(
      map(d => ({
        ...d,
        dataCreacao: new Date(d.dataCreacao),
        dataUltimaEdicao: new Date(d.dataUltimaEdicao)
      }))
    );
  }

  excluirDocumento(id: string): Observable<boolean> {
    return this.http.delete<{ ok: boolean }>(`${this.baseUrl}/${id}`).pipe(
      map(res => res.ok)
    );
  }

  gerarDocumentoComIA(tipoDocumento: TipoDocumento, tomTexto: TomTexto, dadosFormulario: DadosFormulario): Observable<{ conteudo: string; fundamentosJuridicos?: string; pedidos?: string; observacoes?: string }> {
    return this.http.post<{ conteudo: string; fundamentosJuridicos?: string; pedidos?: string; observacoes?: string }>(`${environment.apiUrl}/documentos/gerar-ia`, {
      tipoDocumento,
      tomTexto,
      dadosFormulario
    });
  }


  private gerarId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Métodos para obter opções dos enums
  getTiposDocumento(): TipoDocumento[] {
    return Object.values(TipoDocumento);
  }

  getTonsTexto(): TomTexto[] {
    return Object.values(TomTexto);
  }

  getStatusDocumento(): StatusDocumento[] {
    return Object.values(StatusDocumento);
  }
}