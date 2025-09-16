/**
 * Funções para distribuir pontos de divergência evitando sobreposição entre gateways
 */

/**
 * Distribui pontos de divergência evitando sobreposição com outros gateways
 * Mantém a lógica simétrica (acima, meio, abaixo) mas aumenta o espaçamento dos gateways pais
 * para abrir espaço para os gateways filhos, que usam espaçamento progressivamente menor
 * @param {number} branchCount - Número de branches
 * @param {number} offsetBase - Offset base Y
 * @param {Array} elements - Array de todos os elementos
 * @param {number} currentGatewayIndex - Índice do gateway atual
 * @returns {Array} Array com as posições Y para cada branch
 */
export function distribuirPontosDivergencia(branchCount, offsetBase = 0, elements = [], currentGatewayIndex = -1) {
  if (branchCount === 1) {
    return [offsetBase];
  }

  // Calcula quantos gateways existem DEPOIS dele (gateways filhos)
  const gatewaysAfter = calculateGatewaysAfter(elements, currentGatewayIndex);
  
  // Espaçamento aumenta conforme há mais gateways filhos para abrir espaço
  // Gateway final: espaçamento padrão (90px), Gateway com filhos: mais espaçamento
  const baseSpacing = 90;
  const spacing = baseSpacing + (gatewaysAfter * 45);
  
  const valores = [];
  const inicio = -((branchCount - 1) * spacing) / 2;

  for (let i = 0; i < branchCount; i++) {
    valores.push(offsetBase + inicio + i * spacing);
  }

  return valores;
}

/**
 * Calcula quantos gateways existem DEPOIS do gateway atual (gateways filhos)
 * @param {Array} elements - Array de todos os elementos
 * @param {number} currentGatewayIndex - Índice do gateway atual
 * @returns {number} Número de gateways filhos (0 = gateway final, 1 = tem 1 filho, etc.)
 */
function calculateGatewaysAfter(elements, currentGatewayIndex) {
  if (currentGatewayIndex < 0 || !elements || elements.length === 0) {
    return 0;
  }

  // Conta quantos gateways aparecem DEPOIS do gateway atual no array
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
 * Versão simplificada para compatibilidade com código existente
 * @param {number} x - Número de branches
 * @param {number} offsetBase - Offset base
 * @returns {Array} Array de posições Y
 */
export function distribuirPontosDivergenciaSimples(x, offsetBase = 0) {
  if (x === 1) {
    return [offsetBase];
  }

  const valores = [];
  const inicio = -((x - 1) * 90) / 2;

  for (let i = 0; i < x; i++) {
    valores.push(offsetBase + inicio + i * 90);
  }

  return valores;
}
