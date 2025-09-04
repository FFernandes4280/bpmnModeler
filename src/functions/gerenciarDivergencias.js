/**
 * Gerencia as posições e offsets das divergências de gateways
 * Incorpora as regras de negócio do calcularPosicoesDivergencia.js
 */
export class GerenciadorDivergencias {
  constructor() {
    this.branchOffsets = new Map(); // Map<branchId, {offsetY, positionConfig}>
    this.usedOffsets = new Set();
    this.baseOffsetIncrement = 100;
    this.gatewayConnections = new Map(); // Map<elementId, gatewayParentId>
    this.branchConfigs = new Map(); // Map<elementId, positionConfig>
  }

  /**
   * Registra uma nova divergência usando as regras extraídas do calcularPosicoesDivergencia
   * @param {string} gatewayId - ID do gateway
   * @param {Array} branchIndexes - Índices dos primeiros elementos de cada branch
   * @param {Object} currentBounds - Bounds do gateway atual
   * @param {Object} participantBounds - Bounds do participante
   * @param {Array} participants - Lista de participantes
   * @param {number} laneHeight - Altura da lane
   * @param {string} lane - Lane atual
   */
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

  /**
   * Extrai e adapta as regras do calcularPosicoesDivergencia.js
   * @param {number} diverge - Número de divergências
   * @param {Object} currentBounds - Bounds do gateway
   * @param {Object} participantBounds - Bounds do participante
   * @param {Array} participants - Lista de participantes
   * @param {number} laneHeight - Altura da lane
   * @param {string} lane - Lane atual
   * @returns {Array} Array de configurações de posição
   */
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

  /**
   * Obtém a configuração completa de posição para um elemento
   * @param {number} elementIndex - Índice do elemento
   * @returns {Object|null} Configuração de posição ou null
   */
  obterConfiguracaoCompleta(elementIndex) {
    return this.branchConfigs.get(elementIndex) || null;
  }

  /**
   * Obtém apenas o offset Y de um elemento (compatibilidade com versão anterior)
   * @param {number} elementIndex - Índice do elemento
   * @param {string} gatewayId - ID do gateway pai (opcional)
   * @returns {number} Offset Y para o elemento
   */
  obterOffset(elementIndex, gatewayId = null) {
    const config = this.branchConfigs.get(elementIndex);
    return config ? config.yOffset : 0;
  }

  /**
   * Obtém o ajuste X específico para um elemento baseado nas regras originais
   * @param {number} elementIndex - Índice do elemento
   * @returns {number} Ajuste X para o elemento
   */
  obterAjusteX(elementIndex) {
    const config = this.branchConfigs.get(elementIndex);
    return config && config.adjustX ? config.adjustX : 0;
  }

  /**
   * Obtém o ajuste Y específico para um elemento baseado nas regras originais
   * @param {number} elementIndex - Índice do elemento
   * @returns {number} Ajuste Y para o elemento
   */
  obterAjusteY(elementIndex) {
    const config = this.branchConfigs.get(elementIndex);
    return config && config.adjustY ? config.adjustY : 0;
  }

  /**
   * Obtém o tipo de posição do elemento (cima, meio, baixo)
   * @param {number} elementIndex - Índice do elemento
   * @returns {string} Tipo de posição
   */
  obterTipoPosicao(elementIndex) {
    const config = this.branchConfigs.get(elementIndex);
    return config ? config.type : 'meio';
  }

  /**
   * Verifica se um elemento é o primeiro de um branch
   * @param {number} elementIndex - Índice do elemento
   * @returns {string|null} ID do gateway pai se for primeiro elemento
   */
  ehPrimeiroElementoBranch(elementIndex) {
    return this.gatewayConnections.get(elementIndex) || null;
  }

  /**
   * Aplica as regras de posicionamento a um elemento baseado em sua configuração
   * @param {number} elementIndex - Índice do elemento
   * @param {number} baseX - Posição X base do elemento
   * @param {number} baseY - Posição Y base do elemento
   * @returns {Object} Posição final {x, y}
   */
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
