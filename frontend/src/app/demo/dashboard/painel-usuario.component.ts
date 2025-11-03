import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { DocumentoJuridicoService } from 'src/app/services/documento-juridico.service';
import { DocumentoJuridico, TipoDocumento, StatusDocumento } from 'src/app/models/documento-juridico.model';

@Component({
  selector: 'app-painel-usuario',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './painel-usuario.component.html',
  styleUrls: ['./painel-usuario.component.scss']
})
export class PainelUsuarioComponent implements OnInit {
  carregando = true;

  // Produção do mês
  prodPeticoesIniciais = 0;
  prodRecursos = 0;
  prodReplicasImpugnacoes = 0;
  prodRequerimentos = 0;

  // Economia de tempo
  economiaTotalHoras = 0;
  economiaMediaPorPecaHoras = 0;
  economiaFTE = 0;

  // Qualidade
  percAprovadasSemEdicao = 0;
  percRevisoesNecessarias = 0;
  percRetrabalho = 0;

  private readonly HOURS_PER_FTE = 160; // horas/mês por FTE (estagiário equivalente)
  private readonly SAVINGS_HOURS: Record<TipoDocumento, number> = {
    [TipoDocumento.PETICAO_INICIAL]: 4,
    [TipoDocumento.RECURSO_INOMINADO]: 3,
    [TipoDocumento.RECURSO_ADMINISTRATIVO]: 3,
    [TipoDocumento.REPLICA]: 2,
    [TipoDocumento.IMPUGNACAO]: 2,
    [TipoDocumento.REQUERIMENTO_ADMINISTRATIVO]: 1.5,
    [TipoDocumento.PROCURACAO]: 0.5,
    [TipoDocumento.CONTRATO_HONORARIOS]: 1,
    [TipoDocumento.MANIFESTACAO]: 1.5,
    [TipoDocumento.MANDADO_SEGURANCA]: 4,
    [TipoDocumento.EMBARGOS_DECLARACAO]: 2
  };

  constructor(private documentosService: DocumentoJuridicoService) {}

  ngOnInit(): void {
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);

    this.documentosService
      .listarDocumentos({ dataInicio: inicioMes, dataFim: fimMes }, 1, 10000)
      .subscribe((res) => {
        const docs = res.itens;
        this.calcularProducao(docs);
        this.calcularEconomiaTempo(docs);
        this.calcularQualidade(docs);
        this.carregando = false;
      });
  }

  private calcularProducao(docs: DocumentoJuridico[]) {
    this.prodPeticoesIniciais = docs.filter((d) => d.tipoDocumento === TipoDocumento.PETICAO_INICIAL).length;
    this.prodRecursos = docs.filter((d) =>
      [TipoDocumento.RECURSO_INOMINADO, TipoDocumento.RECURSO_ADMINISTRATIVO].includes(d.tipoDocumento)
    ).length;
    this.prodReplicasImpugnacoes = docs.filter((d) =>
      [TipoDocumento.REPLICA, TipoDocumento.IMPUGNACAO].includes(d.tipoDocumento)
    ).length;
    this.prodRequerimentos = docs.filter((d) => d.tipoDocumento === TipoDocumento.REQUERIMENTO_ADMINISTRATIVO).length;
  }

  private calcularEconomiaTempo(docs: DocumentoJuridico[]) {
    const docsIA = docs.filter((d) => d.geradoPorIA);
    this.economiaTotalHoras = docsIA.reduce((acc, d) => acc + (this.SAVINGS_HOURS[d.tipoDocumento] || 0), 0);
    this.economiaMediaPorPecaHoras = docsIA.length > 0 ? this.economiaTotalHoras / docsIA.length : 0;
    this.economiaFTE = this.economiaTotalHoras / this.HOURS_PER_FTE;
  }

  private calcularQualidade(docs: DocumentoJuridico[]) {
    const finalizados = docs.filter((d) => d.status === StatusDocumento.FINALIZADO);
    const semEdicao = finalizados.filter((d) => d.dataUltimaEdicao.getTime() === d.dataCreacao.getTime());
    const emRevisao = docs.filter((d) => d.status === StatusDocumento.EM_REVISAO);
    const editadosFinalizados = finalizados.filter((d) => d.dataUltimaEdicao.getTime() > d.dataCreacao.getTime());

    this.percAprovadasSemEdicao = finalizados.length > 0 ? (semEdicao.length / finalizados.length) * 100 : 0;
    this.percRevisoesNecessarias = docs.length > 0 ? (emRevisao.length / docs.length) * 100 : 0;
    this.percRetrabalho = finalizados.length > 0 ? (editadosFinalizados.length / finalizados.length) * 100 : 0;
  }
}