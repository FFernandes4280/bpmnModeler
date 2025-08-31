/**
 * Criação de elementos específicos da interface
 */

/**
 * Cria select para tipo de evento
 * @returns {HTMLSelectElement}
 */
export function createEventTypeSelect() {
  const eventTypeSelect = document.createElement('select');
  eventTypeSelect.className = 'element-eventType';
  eventTypeSelect.innerHTML = `
    <option value="Padrão">Padrão</option>
    <option value="Mensagem">Mensagem</option>
    <option value="Timer">Timer</option>
    <option value="Erro">Erro</option>
  `;
  return eventTypeSelect;
}

/**
 * Cria select para tipo de atividade
 * @returns {HTMLSelectElement}
 */
export function createActivityTypeSelect() {
  const activityTypeSelect = document.createElement('select');
  activityTypeSelect.className = 'element-activityType';
  activityTypeSelect.innerHTML = `
    <option value="Default">Padrão</option>
    <option value="In">Recebimento</option>
    <option value="Out">Envio</option>
  `;
  return activityTypeSelect;
}

/**
 * Cria select para tipo de evento final
 * @returns {HTMLSelectElement}
 */
export function createFinalEventTypeSelect() {
  const finalEventTypeSelect = document.createElement('select');
  finalEventTypeSelect.className = 'element-finalEventType';
  finalEventTypeSelect.innerHTML = `
    <option value="Padrão">Padrão</option>
    <option value="Mensagem">Mensagem</option>
    <option value="Timer">Timer</option>
    <option value="Erro">Erro</option>
    <option value="Sinal">Sinal</option>
    <option value="Cancelamento">Cancelamento</option>
    <option value="Compensação">Compensação</option>
    <option value="Escalonamento">Escalonamento</option>
    <option value="Terminar">Terminar</option>
    <option value="Link">Link</option>
  `;
  return finalEventTypeSelect;
}

/**
 * Cria select para direção do data object
 * @returns {HTMLSelectElement}
 */
export function createDataObjectDirectionSelect() {
  const dataObjectDirectionSelect = document.createElement('select');
  dataObjectDirectionSelect.className = 'element-dataObjectDirection';
  dataObjectDirectionSelect.innerHTML = `
    <option value="Envio">Envio</option>
    <option value="Recebimento">Recebimento</option>
  `;
  return dataObjectDirectionSelect;
}

/**
 * Cria select para tipo de gateway existente
 * @returns {HTMLSelectElement}
 */
export function createExistingGatewayTypeSelect() {
  const gatewayTypeSelect = document.createElement('select');
  gatewayTypeSelect.className = 'element-existingGatewayType';
  gatewayTypeSelect.innerHTML = `
    <option value="Gateway Exclusivo">Gateway Exclusivo</option>
    <option value="Gateway Paralelo">Gateway Paralelo</option>
  `;
  return gatewayTypeSelect;
}

/**
 * Cria select para escolher gateway existente
 * @returns {HTMLSelectElement}
 */
export function createExistingGatewaySelect() {
  const gatewaySelect = document.createElement('select');
  gatewaySelect.className = 'element-existingGatewaySelect';
  gatewaySelect.innerHTML = `
    <option value="">Selecione um gateway</option>
  `;
  return gatewaySelect;
}
