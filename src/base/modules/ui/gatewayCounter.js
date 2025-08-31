/**
 * Módulo para criação e gerenciamento do contador de gateways
 */

/**
 * Cria o contador de gateways
 * @returns {HTMLDivElement}
 */
export function createGatewayCounter() {
  const gatewayCounter = document.createElement('div');
  gatewayCounter.className = 'gateway-counter';
  gatewayCounter.innerHTML = `
    <button type="button" class="btn btn-outline-secondary counter-decrease">-</button>
    <span class="counter-value" style="min-width: 120px; text-align: center; padding: 6px 12px; border: 1px solid #dee2e6; background-color: #f8f9fa;">Convergência</span>
    <button type="button" class="btn btn-outline-secondary counter-increase">+</button>
  `;

  let counterValue = 0; // 0 = Convergência, 1+ = números (2, 3, 4...)

  // Event listeners para o contador dos gateways
  gatewayCounter.querySelector('.counter-decrease').addEventListener('click', () => {
    if (counterValue > 0) {
      counterValue--;
      const valueSpan = gatewayCounter.querySelector('.counter-value');
      
      if (counterValue === 0) {
        valueSpan.textContent = 'Convergência';
      } else {
        valueSpan.textContent = counterValue + 1; // Para counterValue=1 → mostra "2", etc
      }
    }
  });

  gatewayCounter.querySelector('.counter-increase').addEventListener('click', () => {
    counterValue++;
    const valueSpan = gatewayCounter.querySelector('.counter-value');
    
    if (counterValue === 0) {
      valueSpan.textContent = 'Convergência';
    } else {
      valueSpan.textContent = counterValue + 1; // Para counterValue=1 → mostra "2", counterValue=2 → mostra "3", etc
    }
  });

  return gatewayCounter;
}

/**
 * Garante que os elementos do gateway counter sejam visualmente separados
 */
export function ensureGatewayCounterSeparation() {
  const gatewayCounters = document.querySelectorAll('.gateway-counter');
  
  gatewayCounters.forEach(counter => {
    // Remove classes que podem causar agrupamento
    counter.classList.remove('btn-group', 'input-group');
    
    // Garante layout em linha com espaçamento adequado
    counter.style.display = 'flex';
    counter.style.alignItems = 'center';
    counter.style.flexWrap = 'nowrap';
    counter.style.gap = '8px';
    
    // Garante que cada elemento tenha suas próprias bordas
    const elements = counter.querySelectorAll('button, span');
    elements.forEach(element => {
      element.style.borderRadius = '6px';
      element.style.margin = '0';
      element.style.flexShrink = '0'; // Impede que diminuam de tamanho
    });
  });
}
