/**
 * Funções para calcular altura de participantes baseada no espaçamento dos gateways
 */

// Constantes de altura e margens (valores pares para cálculos inteiros)
const HEIGHT_PER_PARTICIPANT = 200;
const MARGIN_PER_GATEWAY = 80;
const MARGIN_BASE = 100;

/**
 * Calcula a altura do participante baseada no somatório dos espaçamentos de todos os gateways
 * considerando a lógica de espaçamento progressivo (gateways pais têm mais espaçamento)
 * @param {Array} elements - Array de elementos do diagrama
 * @param {number} participantNumber - Número de participantes
 * @returns {number} Altura calculada do participante
 */
export function calcularAlturaParticipante(elements, participantNumber) {
  const defaultHeight = participantNumber * HEIGHT_PER_PARTICIPANT;
  
  if (!elements || elements.length === 0) {
    return defaultHeight;
  }

  // Conta quantos gateways existem e calcula o somatório dos espaçamentos
  let somatorioEspacamentos = 0;
  let totalGateways = 0;
  
  elements.forEach((element, index) => {
    if (element.type === 'Gateway Exclusivo' || element.type === 'Gateway Paralelo') {
      totalGateways++;
      
      if (element.diverge && element.diverge.length > 0) {
        // Calcula quantos gateways filhos este gateway terá
        const gatewaysFilhos = calculateGatewaysAfter(elements, index);
        
        // Constantes de espaçamento (sincronizadas com distribuirPontosDivergencia)
        const SPACING_BASE = 120; // Base: 120px (par)
        const SPACING_INCREMENT = 60; // Incremento: 60px por gateway filho (par)
        
        // Calcula o espaçamento que este gateway usará (lógica progressiva)
        const spacing = SPACING_BASE + (gatewaysFilhos * SPACING_INCREMENT);
        
        // Calcula a extensão total dos branches deste gateway
        const branchCount = element.diverge.length;
        const extensaoGateway = calculateBranchExtension(branchCount, spacing);
        
        // Adiciona ao somatório
        somatorioEspacamentos += extensaoGateway;
      }
    }
  });

  // Se não há gateways, usa altura padrão
  if (totalGateways === 0) {
    return defaultHeight;
  }

  // Calcula altura baseada no somatório dos espaçamentos
  const alturaCalculada = defaultHeight + 
    (somatorioEspacamentos * 2) + // Multiplica por 2 (para cima e para baixo)
    (totalGateways * MARGIN_PER_GATEWAY) + 
    MARGIN_BASE;
  
  const altura = Math.max(defaultHeight, alturaCalculada);
  
  // Garante que o resultado seja sempre par (divisível por 2)
  // Isso evita frações quando a altura é dividida por 2 para calcular o centro
  return Math.ceil(altura / 2) * 2;
}

/**
 * Calcula quantos gateways existem DEPOIS do gateway atual (gateways filhos)
 * @param {Array} elements - Array de todos os elementos
 * @param {number} currentGatewayIndex - Índice do gateway atual
 * @returns {number} Número de gateways filhos
 */
function calculateGatewaysAfter(elements, currentGatewayIndex) {
  if (currentGatewayIndex < 0 || !elements || elements.length === 0) {
    return 0;
  }

  let gatewaysAfter = 0;
  
  for (let i = currentGatewayIndex + 1; i < elements.length; i++) {
    const element = elements[i];
    if (element && (element.type === 'Gateway Exclusivo' || element.type === 'Gateway Paralelo')) {
      gatewaysAfter++;
    }
  }
  
  return gatewaysAfter;
}

/**
 * Calcula o deslocamento máximo dos branches de um gateway a partir do centro
 * @param {number} branchCount - Número de branches
 * @param {number} spacing - Espaçamento entre branches
 * @returns {number} Deslocamento máximo a partir do centro
 */
function calculateBranchExtension(branchCount, spacing) {
  if (branchCount <= 1) {
    return 0;
  }

  // Para branches simétricas, o deslocamento máximo é do centro até a ponta
  // Exemplo: 2 branches com spacing 180 = [-90, 90] = deslocamento máximo 90
  // Exemplo: 3 branches com spacing 180 = [-180, 0, 180] = deslocamento máximo 180
  const deslocamentoMaximo = ((branchCount - 1) * spacing) / 2;
  
  return deslocamentoMaximo;
}

/**
 * Função de compatibilidade - versão simplificada da função original
 * @param {Array} elements - Array de elementos
 * @param {number} participantNumber - Número de participantes
 * @returns {number} Altura calculada (versão original)
 */
export function calcularAlturaParticipanteOriginal(elements, participantNumber) {
  let maiorDivergencia = 0;
  let defaultHeight = participantNumber * 200;
  
  if (!elements || elements.length === 0) {
    return defaultHeight;
  }
  
  elements.forEach(element => {
    if (element.type === 'Gateway Exclusivo' || element.type === 'Gateway Paralelo') {
      if (element.diverge && element.diverge.length > maiorDivergencia) {
        maiorDivergencia = element.diverge.length;
      }
    }
  });

  if (maiorDivergencia === 0) {
    return defaultHeight;
  }

  return defaultHeight + maiorDivergencia * 80;
}
