export class GerenciadorDivergencias {
  constructor() {
    this.branchOffsets = new Map(); // Map<branchId, {offsetY, positionConfig}>
    this.usedOffsets = new Set();
    this.baseOffsetIncrement = 100;
    this.gatewayConnections = new Map(); // Map<elementId, gatewayParentId>
    this.branchConfigs = new Map(); // Map<elementId, positionConfig>
  }

  registrarDivergencia(gatewayId, branchIndexes, currentBounds, participantBounds, participants, laneHeight, lane) {
    const numBranches = branchIndexes.length;
    
    if (numBranches === 0) return;

    // Usa as regras extraídas do calcularPosicoesDivergencia
    const positions = this.calcularPosicoesComRegrasOriginais(
      numBranches, 
      currentBounds, 
      participantBounds, 
      participants, 
      laneHeight, 
      lane
    );
    
    // Registra cada branch com sua configuração específica
    branchIndexes.forEach((branchFirstIndex, i) => {
      const branchId = `${gatewayId}_branch_${i}`;
      const positionConfig = positions[i];
      
      this.branchOffsets.set(branchId, {
        offsetY: positionConfig.yOffset,
        positionConfig: positionConfig
      });
      
      this.branchConfigs.set(branchFirstIndex, positionConfig);
      this.gatewayConnections.set(branchFirstIndex, gatewayId);
      
      console.log(`Branch ${branchId} registrado:`, positionConfig);
    });
  }

  calcularPosicoesComRegrasOriginais(diverge, currentBounds, participantBounds, participants, laneHeight, lane) {
    const positions = [];
    const baseX = currentBounds.x + 150;
    
    // Regra original: Para convergência (diverge = "1"), mantém a posição Y do elemento anterior
    // Para divergência, calcula baseado na lane
    const baseY = diverge === 1 ? 
      currentBounds.y : 
      participantBounds.y + participants.indexOf(lane) * laneHeight + laneHeight / 2 - 18;
      
    for (let i = 0; i < diverge; i++) {
      const yOffset = (i - (diverge - 1) / 2) * (laneHeight / (diverge + 1));
      let position;

      if (diverge === 1) {
        // Regra original: Apenas meio
        position = {
          x: baseX ,
          y: baseY,
          width: 35,
          height: 35,
          yOffset: yOffset,
          type: 'meio'
        };
      } else if (diverge === 2) {
        // Regra original: Apenas cima e baixo
        const isTop = i === 0;
        const yAdjust = isTop ? -17.5 : +17.5;

        position = {
          x: baseX - 17.5,
          y: baseY + yAdjust,
          width: 35,
          height: 35,
          yOffset: yOffset,
          type: isTop ? 'cima' : 'baixo',
          adjustX: -17.5,
          adjustY: yAdjust
        };
      } else if (diverge === 3) {
        // Regra original: Cima, meio e baixo
        if (i === 0) {
          // Cima
          position = {
            x: baseX - 17.5,
            y: baseY - 17.5,
            width: 35,
            height: 35,
            yOffset: yOffset,
            type: 'cima',
            adjustX: -17.5,
            adjustY: -17.5
          };
        } else if (i === 1) {
          // Meio
          position = {
            x: baseX - 17.5,
            y: baseY,
            width: 35,
            height: 35,
            yOffset: yOffset,
            type: 'meio',
            adjustX: -17.5
          };
        } else if (i === 2) {
          // Baixo
          position = {
            x: baseX - 17.5,
            y: baseY + 17.5,
            width: 35,
            height: 35,
            yOffset: yOffset,
            type: 'baixo',
            adjustX: -17.5,
            adjustY: +17.5
          };
        }
      } else {
        // Regra original: diverge > 3
        if (i === 0) {
          // Cima
          position = {
            x: baseX - 17.5,
            y: baseY - 17.5,
            width: 35,
            height: 35,
            yOffset: yOffset,
            type: 'cima',
            adjustX: -17.5,
            adjustY: -17.5
          };
        } else if (i === diverge - 1) {
          // Baixo
          position = {
            x: baseX - 17.5,
            y: baseY + 17.5,
            width: 35,
            height: 35,
            yOffset: yOffset,
            type: 'baixo',
            adjustX: -17.5,
            adjustY: +17.5
          };
        } else {
          // Meio
          position = {
            x: baseX,
            y: baseY,
            width: 35,
            height: 35,
            yOffset: yOffset,
            type: 'meio'
          };
        }
      }

      positions.push(position);
    }

    return positions;
  }


  obterConfiguracaoCompleta(elementIndex) {
    return this.branchConfigs.get(elementIndex) || null;
  }

  obterOffset(elementIndex) {
    const config = this.branchConfigs.get(elementIndex);
    return config ? config.yOffset : 0;
  }

  obterAjusteX(elementIndex) {
    const config = this.branchConfigs.get(elementIndex);
    return config && config.adjustX ? config.adjustX : 0;
  }

  obterAjusteY(elementIndex) {
    const config = this.branchConfigs.get(elementIndex);
    return config && config.adjustY ? config.adjustY : 0;
  }

  obterTipoPosicao(elementIndex) {
    const config = this.branchConfigs.get(elementIndex);
    return config ? config.type : 'meio';
  }

  ehPrimeiroElementoBranch(elementIndex) {
    return this.gatewayConnections.get(elementIndex) || null;
  }

  aplicarRegrasPositionamento(elementIndex, baseX, baseY) {
    const config = this.obterConfiguracaoCompleta(elementIndex);
    
    if (!config) {
      return { x: baseX, y: baseY };
    }

    return {
      x: baseX + (config.adjustX || 0),
      y: baseY + (config.adjustY || 0) + config.yOffset,
      width: config.width,
      height: config.height,
      type: config.type
    };
  }
  
  registrarConfiguracaoHerdada(elementIndex, configAnterior) {
    // Cria uma nova configuração baseada na anterior, mantendo yOffset e adjustX/Y
    const configHerdada = {
      ...configAnterior,
      // Mantém as posições de offset do elemento anterior
      yOffset: configAnterior.yOffset,
      adjustX: configAnterior.adjustX,
      adjustY: configAnterior.adjustY,
      type: configAnterior.type
    };
    
    this.branchConfigs.set(elementIndex, configHerdada);
  }

  /**
   * Limpa dados de divergências (para nova geração de diagrama)
   */
  limpar() {
    this.branchOffsets.clear();
    this.usedOffsets.clear();
    this.gatewayConnections.clear();
    this.branchConfigs.clear();
  }
}

// Instância singleton para uso global
export const gerenciadorDivergencias = new GerenciadorDivergencias();
