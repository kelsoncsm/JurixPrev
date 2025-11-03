-- JurixPrev database schema (PostgreSQL)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    estado_civil VARCHAR(50) NOT NULL,
    profissao VARCHAR(100) NOT NULL,
    cpf VARCHAR(20) NOT NULL,
    rg VARCHAR(50) NOT NULL,
    orgao_expedidor VARCHAR(50) NOT NULL,
    nit VARCHAR(50) NOT NULL,
    numero_beneficio VARCHAR(50) NOT NULL,
    data_nascimento DATE NOT NULL,
    nome_mae VARCHAR(255) NOT NULL,
    nome_pai VARCHAR(255) NOT NULL,
    endereco TEXT NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    uf CHAR(2) NOT NULL,
    logo_url TEXT
);

-- Indexes (e.g., email, cpf)
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes (email);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes (cpf);

-- Documentos
CREATE TABLE IF NOT EXISTS documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_documento VARCHAR(100) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    tom_texto VARCHAR(50) NOT NULL,
    conteudo TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    data_creacao DATE NOT NULL,
    data_ultima_edicao DATE NOT NULL,
    gerado_por_ia VARCHAR(5) NOT NULL DEFAULT 'false',
    dados_formulario TEXT
);
CREATE INDEX IF NOT EXISTS idx_documentos_status ON documentos (status);