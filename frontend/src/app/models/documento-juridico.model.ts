export interface DocumentoJuridico {
  id: string;
  tipoDocumento: TipoDocumento;
  titulo: string;
  tomTexto: TomTexto;
  conteudo: string;
  status: StatusDocumento;
  dataCreacao: Date;
  dataUltimaEdicao: Date;
  dadosFormulario?: DadosFormulario;
  revisao?: string;
  geradoPorIA: boolean;
}

export enum TipoDocumento {
  PROCURACAO = 'Procuração',
  CONTRATO_HONORARIOS = 'Contrato de Honorários',
  PETICAO_INICIAL = 'Petição Inicial',
  REQUERIMENTO_ADMINISTRATIVO = 'Requerimento Administrativo',
  RECURSO_INOMINADO = 'Recurso Inominado',
  RECURSO_ADMINISTRATIVO = 'Recurso Administrativo',
  REPLICA = 'Réplica',
  IMPUGNACAO = 'Impugnação',
  MANIFESTACAO = 'Manifestação',
  MANDADO_SEGURANCA = 'Mandado de Segurança',
  EMBARGOS_DECLARACAO = 'Embargos de Declaração'
}

export enum TomTexto {
  TECNICO = 'Técnico',
  SIMPLIFICADO = 'Simplificado',
  PERSUASIVO = 'Persuasivo',
  FORMAL = 'Formal',
  OBJETIVO = 'Objetivo'
}

export enum StatusDocumento {
  RASCUNHO = 'Rascunho',
  EM_REVISAO = 'Em Revisão',
  FINALIZADO = 'Finalizado',
  ARQUIVADO = 'Arquivado'
}

export interface DadosFormulario {
  // Dados do cliente
  nomeCliente?: string;
  cpfCnpj?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  qualificacaoCliente?: string;
  
  // Dados do procedimento
  numeroProcedimento?: string;
  vara?: string;
  comarca?: string;
  
  // Dados da parte contrária
  nomeReu?: string;
  qualificacaoReu?: string;
  
  // Dados do advogado
  nomeAdvogado?: string;
  oabAdvogado?: string;
  
  // Conteúdo jurídico
  relatoFatos?: string;
  fundamentacaoJuridica?: string;
  pedidos?: string;
  valorCausa?: number;
  
  // Dados específicos para contratos
  objetoContrato?: string;
  valorHonorarios?: string;
  formaPagamento?: string;
  
  // Dados gerais
  localData?: string;
  
  // Campos dinâmicos adicionais
  [key: string]: any;
}

export interface FiltroDocumento {
  tipoDocumento?: TipoDocumento;
  status?: StatusDocumento;
  dataInicio?: Date;
  dataFim?: Date;
  termo?: string;
}

export interface PaginacaoDocumento {
  pagina: number;
  itensPorPagina: number;
  totalItens: number;
  totalPaginas: number;
}

export interface ResultadoPaginado<T> {
  itens: T[];
  paginacao: PaginacaoDocumento;
}