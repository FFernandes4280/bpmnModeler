/**
 * Funções para calcular altura de participantes baseada no espaçamento dos gateways
 */

/**
 * Calcula a altura do participante baseada no espaçamento esperado dos gateways
 * após todos os elementos serem processados, considerando a nova lógica de distribuição
 * @param {Array} elements - Array de elementos do diagrama
 * @param {number} participantNumber - Número de participantes
 * @returns {number} Altura calculada do participante
 */
export function calcularAlturaParticipante(elements, participantNumber) {
  const defaultHeight = participantNumber * 200;
  
  if (!elements || elements.length === 0) {
    return defaultHeight;
  }

  // Encontra todos os gateways e calcula o espaçamento máximo esperado
  let maxEspacamentoEsperado = 0;
  
  elements.forEach((element, index) => {
    if (element.type === 'Gateway Exclusivo' || element.type === 'Gateway Paralelo') {
      if (element.diverge && element.diverge.length > 0) {
        // Calcula quantos gateways filhos este gateway terá
        const gatewaysFilhos = calculateGatewaysAfter(elements, index);
        
        // Calcula o espaçamento que este gateway usará
        const baseSpacing = 90;
        const spacing = baseSpacing + (gatewaysFilhos * 45);
        
        // Calcula a extensão total dos branches deste gateway
        const branchCount = element.diverge.length;
        const extensaoTotal = calculateBranchExtension(branchCount, spacing);
        
        // Mantém o maior espaçamento encontrado
        if (extensaoTotal > maxEspacamentoEsperado) {
          maxEspacamentoEsperado = extensaoTotal;
        }
      }
    }
  });

  // Se não há gateways, usa altura padrão
  if (maxEspacamentoEsperado === 0) {
    return defaultHeight;
  }

  // Calcula altura baseada no espaçamento máximo esperado
  // Adiciona margem de segurança (20% extra)
  const alturaBaseadaEmEspacamento = defaultHeight + (maxEspacamentoEsperado * 1.2);
  
  return Math.max(defaultHeight, alturaBaseadaEmEspacamento);
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
 * Calcula a extensão total dos branches de um gateway
 * @param {number} branchCount - Número de branches
 * @param {number} spacing - Espaçamento entre branches
 * @returns {number} Extensão total dos branches
 */
function calculateBranchExtension(branchCount, spacing) {
  if (branchCount <= 1) {
    return 0;
  }

  // Para branches simétricas, a extensão vai do primeiro ao último branch
  // Exemplo: 3 branches com spacing 180 = [-180, 0, 180] = extensão de 360
  const inicio = -((branchCount - 1) * spacing) / 2;
  const fim = ((branchCount - 1) * spacing) / 2;
  
  return Math.abs(fim - inicio);
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
