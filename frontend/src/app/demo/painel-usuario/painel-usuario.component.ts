import { Component, OnInit } from '@angular/core';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { DocumentoJuridicoService } from 'src/app/services/documento-juridico.service';
import {
  DocumentoJuridico,
  TipoDocumento,
  StatusDocumento
} from 'src/app/models/documento-juridico.model';

@Component({
  selector: 'app-painel-usuario',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './painel-usuario.component.html',
  styleUrls: ['./painel-usuario.component.scss']
})
export class PainelUsuarioComponent implements OnInit {
  documentos: DocumentoJuridico[] = [];
  TipoDocumento = TipoDocumento;

  // Mapa simples de horas por tipo de documento (ajustável futuramente)
  private horasPorTipo: Record<string, number> = {
    [TipoDocumento.PETICAO_INICIAL]: 5,
    [TipoDocumento.RECURSO_INOMINADO]: 4,
    [TipoDocumento.REPLICA]: 3,
    [TipoDocumento.IMPUGNACAO]: 3,
    [TipoDocumento.REQUERIMENTO_ADMINISTRATIVO]: 2,
    [TipoDocumento.RECURSO_ADMINISTRATIVO]: 3,
    [TipoDocumento.PROCURACAO]: 1,
    [TipoDocumento.CONTRATO_HONORARIOS]: 2,
    [TipoDocumento.MANIFESTACAO]: 2,
    [TipoDocumento.MANDADO_SEGURANCA]: 6,
    [TipoDocumento.EMBARGOS_DECLARACAO]: 2
  };

  constructor(private documentosService: DocumentoJuridicoService) {}

  ngOnInit(): void {
    // Buscar muitos itens para computar métricas (mock)
    this.documentosService
      .listarDocumentos(undefined, 1, 1000)
      .subscribe((resultado) => {
        this.documentos = resultado.itens;
      });
  }

  // Produção do mês (simplesmente conta por tipo)
  contarPorTipo(tipo: TipoDocumento): number {
    return this.documentos.filter((d) => d.tipoDocumento === tipo).length;
  }

  // Economia de tempo baseada em IA
  get horasTotaisEconomizadas(): number {
    return this.documentos
      .filter((d) => d.geradoPorIA)
      .reduce((acc, d) => acc + (this.horasPorTipo[d.tipoDocumento] || 0), 0);
  }

  get horasMediasPorDocumento(): number {
    const iaDocs = this.documentos.filter((d) => d.geradoPorIA);
    if (iaDocs.length === 0) return 0;
    return parseFloat((this.horasTotaisEconomizadas / iaDocs.length).toFixed(1));
  }

  get fteEstimado(): number {
    // 1 FTE ~ 160h/mês
    return parseFloat((this.horasTotaisEconomizadas / 160).toFixed(2));
  }

  // Qualidade (estimativas)
  get percentualAprovacaoSemEdicao(): number {
    const base = this.documentos.length || 1;
    const aprovadosSemEdicao = this.documentos.filter(
      (d) =>
        d.status === StatusDocumento.FINALIZADO &&
        d.geradoPorIA &&
        d.dataUltimaEdicao.getTime() === d.dataCreacao.getTime()
    ).length;
    return parseFloat(((aprovadosSemEdicao / base) * 100).toFixed(1));
  }

  get percentualRevisaoNecessaria(): number {
    const base = this.documentos.length || 1;
    const revisao = this.documentos.filter((d) => d.status === StatusDocumento.EM_REVISAO).length;
    return parseFloat(((revisao / base) * 100).toFixed(1));
  }

  get percentualRetrabalho(): number {
    const base = this.documentos.length || 1;
    const retrabalho = this.documentos.filter(
      (d) => d.geradoPorIA && d.status !== StatusDocumento.FINALIZADO && d.dataUltimaEdicao > d.dataCreacao
    ).length;
    return parseFloat(((retrabalho / base) * 100).toFixed(1));
  }
}