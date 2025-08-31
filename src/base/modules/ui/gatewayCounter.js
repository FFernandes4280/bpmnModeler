/**
 * Módulo para criação e gerenciamento do contador de gateways
 */

import { initGatewayBranches, removeGatewayBranches } from './gatewayBranches.js';

export function createGatewayCounter(elementsContainer = null, participantsInput = null) {
  const gatewayCounter = document.createElement('div');
  gatewayCounter.className = 'gateway-counter';
  gatewayCounter.innerHTML = `
    <button type="button" class="counter-btn counter-decrease">−</button>
    <span class="counter-value">Convergência</span>
    <button type="button" class="counter-btn counter-increase">+</button>
  `;

  let counterValue = 0; // 0 = Convergência, 1+ = números (2, 3, 4...)

  // Função para atualizar branches baseado no counter value
  function updateBranches() {
    const currentRow = gatewayCounter.closest('.element-row');
    if (!currentRow || !elementsContainer || !participantsInput) return;

    const elementType = currentRow.querySelector('.element-type').value;
    if (elementType !== 'Gateway Exclusivo' && elementType !== 'Gateway Paralelo') return;

    // Gera um ID único para este gateway baseado na posição
    const allRows = Array.from(document.querySelectorAll('.element-row'));
    const rowIndex = allRows.indexOf(currentRow);
    const gatewayId = `gateway_${elementType.replace(' ', '')}_${rowIndex}`;

    if (counterValue <= 0) {
      // Convergência ou valor inválido - remove branches
      removeGatewayBranches(gatewayId);
    } else {
      // Divergência - cria/atualiza branches
      const branchCount = counterValue + 1; // +1 porque counterValue=1 = 2 branches
      initGatewayBranches(gatewayId, branchCount, elementsContainer, participantsInput);
    }
  }

  // Event listeners para o contador dos gateways
  gatewayCounter.querySelector('.counter-decrease').addEventListener('click', () => {
    if (counterValue > 0) {
      counterValue--;
      const valueSpan = gatewayCounter.querySelector('.counter-value');
      const decreaseBtn = gatewayCounter.querySelector('.counter-decrease');
      
      if (counterValue === 0) {
        valueSpan.textContent = 'Convergência';
        decreaseBtn.disabled = true; // Desabilita quando chega no limite inferior
      } else {
        valueSpan.textContent = counterValue + 1; // Para counterValue=1 → mostra "2", etc
        decreaseBtn.disabled = false;
      }
      
      // Atualiza branches
      updateBranches();
    }
  });

  gatewayCounter.querySelector('.counter-increase').addEventListener('click', () => {
    counterValue++;
    const valueSpan = gatewayCounter.querySelector('.counter-value');
    const decreaseBtn = gatewayCounter.querySelector('.counter-decrease');
    
    if (counterValue === 0) {
      valueSpan.textContent = 'Convergência';
    } else {
      valueSpan.textContent = counterValue + 1; // Para counterValue=1 → mostra "2", counterValue=2 → mostra "3", etc
    }
    
    // Habilita o botão de decremento quando não estiver no limite inferior
    if (counterValue > 0) {
      decreaseBtn.disabled = false;
    }
    
    // Atualiza branches
    updateBranches();
  });

  // Inicializa o estado dos botões
  const decreaseBtn = gatewayCounter.querySelector('.counter-decrease');
  decreaseBtn.disabled = true; // Começa desabilitado porque inicia em "Convergência"

  return gatewayCounter;
}

/**
 * Garante que os elementos do gateway counter tenham o visual correto
 */
export function ensureGatewayCounterSeparation() {
  const gatewayCounters = document.querySelectorAll('.gateway-counter');
  
  gatewayCounters.forEach(counter => {
    // Garante que os botões tenham as classes corretas
    const decreaseBtn = counter.querySelector('.counter-decrease');
    const increaseBtn = counter.querySelector('.counter-increase');
    const valueSpan = counter.querySelector('.counter-value');
    
    if (decreaseBtn) {
      decreaseBtn.className = 'counter-btn counter-decrease';
    }
    
    if (increaseBtn) {
      increaseBtn.className = 'counter-btn counter-increase';
    }
    
    if (valueSpan) {
      valueSpan.className = 'counter-value';
    }
  });
}
