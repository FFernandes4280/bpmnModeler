/**
 * Utilitários para manipulação do DOM
 */

/**
 * Obtém os participantes como opções
 * @param {HTMLInputElement} participantsInput - Input dos participantes
 * @returns {Array<string>} Array de participantes válidos
 */
export function getParticipantsOptions(participantsInput) {
  return participantsInput.value
    .split(',')
    .map(participant => participant.trim())
    .filter(participant => participant !== '');
}

/**
 * Atualiza a numeração dos elementos
 * @param {HTMLElement} elementsContainer - Container dos elementos
 */
export function updateElementNumbers(elementsContainer) {
  const rows = elementsContainer.querySelectorAll('.element-row');
  rows.forEach((row, index) => {
    const numberElement = row.querySelector('.element-number');
    if (numberElement) {
      numberElement.textContent = index + 1;
    }

    // Atualiza o estado dos botões de movimento
    const moveUpBtn = row.querySelector('.move-up');
    const moveDownBtn = row.querySelector('.move-down');

    if (moveUpBtn) {
      moveUpBtn.disabled = index === 0;
    }
    if (moveDownBtn) {
      moveDownBtn.disabled = index === rows.length - 1;
    }
  });
}

/**
 * Move elemento para cima
 * @param {HTMLElement} row - Elemento a ser movido
 * @param {HTMLElement} elementsContainer - Container dos elementos
 */
export function moveElementUp(row, elementsContainer) {
  const previousRow = row.previousElementSibling;
  if (previousRow) {
    elementsContainer.insertBefore(row, previousRow);
    updateElementNumbers(elementsContainer);
  }
}

/**
 * Move elemento para baixo
 * @param {HTMLElement} row - Elemento a ser movido
 * @param {HTMLElement} elementsContainer - Container dos elementos
 */
export function moveElementDown(row, elementsContainer) {
  const nextRow = row.nextElementSibling;
  if (nextRow) {
    elementsContainer.insertBefore(nextRow, row);
    updateElementNumbers(elementsContainer);
  }
}
