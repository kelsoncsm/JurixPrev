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

  gerarDocumentoComIA(tipoDocumento: TipoDocumento, tomTexto: TomTexto, dadosFormulario: DadosFormulario): Observable<string> {
    const conteudo = this.gerarConteudoIA(tipoDocumento, dadosFormulario, tomTexto);
    return of(conteudo).pipe(delay(2000)); // Simular tempo de processamento da IA
  }

  private gerarConteudoIA(tipoDocumento: TipoDocumento, dadosFormulario: DadosFormulario, tomTexto: TomTexto): string {
    // Templates básicos para diferentes tipos de documento
    const templates: Record<string, string> = {
      [TipoDocumento.PETICAO_INICIAL]: `
EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA ${dadosFormulario.vara || '[VARA]'}

${dadosFormulario.nomeCliente || '[NOME DO CLIENTE]'}, ${dadosFormulario.qualificacaoCliente || '[QUALIFICAÇÃO]'}, por meio de seu advogado que esta subscreve, vem respeitosamente à presença de Vossa Excelência propor a presente

PETIÇÃO INICIAL

em face de ${dadosFormulario.nomeReu || '[NOME DO RÉU]'}, ${dadosFormulario.qualificacaoReu || '[QUALIFICAÇÃO DO RÉU]'}, pelos fatos e fundamentos jurídicos a seguir expostos:

I - DOS FATOS

${dadosFormulario.relatoFatos || '[RELATO DOS FATOS]'}

II - DO DIREITO

${dadosFormulario.fundamentacaoJuridica || '[FUNDAMENTAÇÃO JURÍDICA]'}

III - DOS PEDIDOS

Diante do exposto, requer-se:

a) ${dadosFormulario.pedidos || '[PEDIDOS]'};

b) A condenação da parte requerida ao pagamento das custas processuais e honorários advocatícios.

Termos em que pede deferimento.

${dadosFormulario.localData || '[LOCAL E DATA]'}

${dadosFormulario.nomeAdvogado || '[NOME DO ADVOGADO]'}
OAB/[UF] nº ${dadosFormulario.oabAdvogado || '[NÚMERO OAB]'}
      `,
      [TipoDocumento.PROCURACAO]: `
PROCURAÇÃO

OUTORGANTE: ${dadosFormulario.nomeCliente || '[NOME DO CLIENTE]'}, ${dadosFormulario.qualificacaoCliente || '[QUALIFICAÇÃO]'}

OUTORGADO: ${dadosFormulario.nomeAdvogado || '[NOME DO ADVOGADO]'}, advogado, inscrito na OAB/[UF] sob o nº ${dadosFormulario.oabAdvogado || '[NÚMERO OAB]'}

PODERES: O outorgante confere ao outorgado os poderes para representá-lo em juízo ou fora dele, podendo propor ações, contestar, transigir, desistir, renunciar ao direito sobre que se funda a ação, receber citação, confessar, firmar compromisso, dar e receber quitação e praticar todos os atos necessários ao bom desempenho do mandato.

${dadosFormulario.localData || '[LOCAL E DATA]'}

_________________________________
${dadosFormulario.nomeCliente || '[NOME DO CLIENTE]'}
Outorgante
      `,
      [TipoDocumento.CONTRATO_HONORARIOS]: `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS

CONTRATANTE: ${dadosFormulario.nomeCliente || '[NOME DO CLIENTE]'}, ${dadosFormulario.qualificacaoCliente || '[QUALIFICAÇÃO]'}

CONTRATADO: ${dadosFormulario.nomeAdvogado || '[NOME DO ADVOGADO]'}, advogado, inscrito na OAB/[UF] sob o nº ${dadosFormulario.oabAdvogado || '[NÚMERO OAB]'}

DO OBJETO: O presente contrato tem por objeto a prestação de serviços advocatícios relacionados a ${dadosFormulario.objetoContrato || '[OBJETO DO CONTRATO]'}.

DOS HONORÁRIOS: Os honorários advocatícios são fixados em R$ ${dadosFormulario.valorHonorarios || '[VALOR]'}, a serem pagos ${dadosFormulario.formaPagamento || '[FORMA DE PAGAMENTO]'}.

${dadosFormulario.localData || '[LOCAL E DATA]'}

_________________________________        _________________________________
${dadosFormulario.nomeCliente || '[CONTRATANTE]'}        ${dadosFormulario.nomeAdvogado || '[CONTRATADO]'}
      `
    };

    const conteudo = templates[tipoDocumento] || `Documento do tipo ${tipoDocumento} gerado automaticamente pela IA.

Dados do cliente: ${dadosFormulario.nomeCliente || 'Não informado'}
Procedimento: ${dadosFormulario.numeroProcedimento || 'Não informado'}

Este é um modelo básico que deve ser personalizado conforme as necessidades específicas do caso.`;

    // Ajustar tom do texto baseado na seleção
    switch (tomTexto) {
      case TomTexto.SIMPLIFICADO:
        return conteudo.replace(/Excelentíssimo/g, 'Ilustríssimo')
                      .replace(/respeitosamente/g, '')
                      .replace(/Vossa Excelência/g, 'Vossa Senhoria');
      case TomTexto.PERSUASIVO:
        return `${conteudo}\n\nCom a devida vênia, os fatos e fundamentos apresentados demonstram de forma inequívoca o direito pleiteado, razão pela qual se espera o deferimento dos pedidos formulados.`;
      default:
        return conteudo;
    }
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