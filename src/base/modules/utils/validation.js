/**
 * Validações do formulário
 */

import { getParticipantsOptions } from './domHelpers.js';

/**
 * Valida se todos os campos obrigatórios estão preenchidos
 * @param {boolean} showError - Se deve exibir erro no console
 * @returns {boolean} - True se todos os campos estão válidos
 */
export function validateRequiredFields(showError = false) {
  const processName = document.getElementById('processName').value;
  const participantsInput = document.getElementById('participants');
  const participants = getParticipantsOptions(participantsInput);
  const initialEventName = document.getElementById('initialEventName').value;
  const initialEventLane = document.getElementById('initialEventLane').value;
  
  const isValid = !(!processName || !participants.length || !initialEventName || !initialEventLane);
  
  if (!isValid && showError) {
    console.error('Preencha todos os campos obrigatórios.');
  }
  
  return isValid;
}
