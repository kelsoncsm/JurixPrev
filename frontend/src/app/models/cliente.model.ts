export interface Cliente {
  id?: string;
  nomeCompleto: string;
  email: string;
  estadoCivil: EstadoCivil;
  profissao: string;
  cpf: string;
  rg: string;
  orgaoExpedidor: string;
  nit: string;
  numeroBeneficio: string;
  dataNascimento: Date;
  nomeMae: string;
  nomePai: string;
  endereco: string;
  bairro: string;
  cidade: string;
  uf: string;
  usuarioId?: string;
  dataCriacao?: Date;
  dataAtualizacao?: Date;
}

export enum EstadoCivil {
  SOLTEIRO = 'Solteiro(a)',
  CASADO = 'Casado(a)',
  DIVORCIADO = 'Divorciado(a)',
  VIUVO = 'Viúvo(a)',
  UNIAO_ESTAVEL = 'União Estável'
}

export interface DadosFormularioCliente {
  nomeCompleto: string;
  email: string;
  estadoCivil: EstadoCivil;
  profissao: string;
  cpf: string;
  rg: string;
  orgaoExpedidor: string;
  nit: string;
  numeroBeneficio: string;
  dataNascimento: string; // String para formulário, será convertida para Date
  nomeMae: string;
  nomePai: string;
  endereco: string;
  bairro: string;
  cidade: string;
  uf: string;
}