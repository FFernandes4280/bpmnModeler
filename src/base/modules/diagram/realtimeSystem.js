/**
 * Sistema de atualização em tempo real
 */

/**
 * Configura listeners de atualização em tempo real
 * @param {Function} updateDiagram - Função de atualização do diagrama
 * @param {HTMLElement} elementsContainer - Container dos elementos
 */
export function setupRealtimeUpdate(updateDiagram, elementsContainer) {
  // Campos principais do formulário
  const fieldsToWatch = [
    'processName',
    'participants', 
    'hasExternalParticipants',
    'externalParticipants',
    'initialEventName',
    'initialEventType',
    'initialEventLane'
  ];

  // Adiciona listeners para campos de texto e selects
  fieldsToWatch.forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element) {
      element.addEventListener('input', updateDiagram);
      element.addEventListener('change', updateDiagram);
    }
  });

  // Observer para mudanças no container de elementos
  const observer = new MutationObserver(() => {
    updateDiagram();
    setupElementRowListeners(updateDiagram); // Reconfigura listeners para novas linhas
  });

  observer.observe(elementsContainer, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['value']
  });
}

/**
 * Configura listeners nas linhas de elementos
 * @param {Function} updateDiagram - Função de atualização do diagrama
 */
export function setupElementRowListeners(updateDiagram) {
  const rows = document.querySelectorAll('.element-row');
  
  rows.forEach(row => {
    // Verifica se a linha já tem listeners configurados
    if (row.dataset.listenersConfigured) return;
    
    // Marca a linha como configurada
    row.dataset.listenersConfigured = 'true';
    
    // Adiciona listeners para todos os inputs e selects da linha
    const inputs = row.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.addEventListener('input', updateDiagram);
      input.addEventListener('change', updateDiagram);
    });
  });
}
