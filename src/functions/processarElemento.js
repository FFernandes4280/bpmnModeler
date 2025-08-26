import criarAtividade from './criarAtividade.js';
import criarEventoIntermediario from './criarEventoIntermediario.js';
import criarGatewayExclusivo from './criarGatewayExclusivo.js';
import criarGatewayParalelo from './criarGatewayParalelo.js';
import criarEventoFinal from './criarEventoFinal.js';
import criarDataObject from './criarDataObject.js';
import criarFluxoMensagem from './criarFluxoMensagem.js';
import calcularPosicoesDivergencia from './calcularPosicoesDivergencia.js';
import conectarGatewayExclusivoExistente from './conectarGatewayExclusivoExistente.js';
import conectarGatewayParaleloExistente from './conectarGatewayParaleloExistente.js';
import buscarGatewayExistente from './buscarGatewayExistente.js';

export default function processarElemento(
  element,
  moddle,
  bpmnProcess,
  bpmnPlane,
  collaboration,
  currentElement,
  currentBounds,
  participantBounds,
  participants,
  laneHeight,
  externalParticipants,
  elementTracker,
  boundsTracker
) {
  /**
   * Helper function to update the current element and bounds in the trackers
   * @param {Object} newElement - The new current element
   * @param {Object} newBounds - The new current bounds
   */
  const updateCurrentState = (newElement, newBounds) => {
    elementTracker.set('current', newElement);
    boundsTracker.set('current', newBounds);
  };

  /**
   * Helper function to add multiple positions for gateway divergence
   * @param {Object} gatewayElement - The gateway element
   * @param {Array} positions - Array of position bounds for each divergent path
   */
  const addMultiplePositions = (gatewayElement, positions) => {
    const nextPositionsElements = elementTracker.get('nextPositions');
    const nextPositionsBounds = boundsTracker.get('nextPositions');
    
    for (const position of positions) {
      nextPositionsElements.push(gatewayElement);
      nextPositionsBounds.push(position);
    }
  };

  let { type, name, lane, diverge } = element;
  let eventType = '';
  let activityType = '';

  switch (type) {
    case 'Mensagem':
      if (name === 'Envio' || name === 'Recebimento') {
        criarFluxoMensagem(
          moddle,
          collaboration,
          bpmnPlane,
          currentElement,
          currentBounds,
          externalParticipants,
          participantBounds,
          name,
          lane
        );
      } else {
        console.error(`Nome de mensagem inválido: "${name}". Use "Envio" ou "Recebimento".`);
      }
      updateCurrentState(currentElement, currentBounds);
      break;

    case 'Atividade':
      activityType = name.split('_')[0];
      name = name.split('_')[1];
      const activityElement = criarAtividade(
        moddle,
        bpmnProcess,
        bpmnPlane,
        currentElement,
        currentBounds,
        participantBounds,
        participants,
        laneHeight,
        activityType,
        name,
        lane
      );
      updateCurrentState(activityElement.activity, activityElement.activityShape.bounds);
      break;

    case 'Evento Intermediario':
      eventType = name.split('_')[0];
      name = name.split('_')[1];
      const intermediateEvent = criarEventoIntermediario(
        moddle,
        bpmnProcess,
        bpmnPlane,
        currentElement,
        currentBounds,
        participantBounds,
        participants,
        laneHeight,
        name,
        eventType,
        lane
      );
      updateCurrentState(intermediateEvent.intermediateEvent, intermediateEvent.intermediateEventShape.bounds);
      break;

    case 'Gateway Exclusivo':
      const existingExclusiveGateway = buscarGatewayExistente(bpmnPlane, 'ExclusiveGateway', name);

      if (existingExclusiveGateway) {
        conectarGatewayExclusivoExistente(
          moddle,
          bpmnProcess,
          bpmnPlane,
          currentElement,
          currentBounds,
          existingExclusiveGateway,
          elementTracker.get('nextPositions')
        );
        
        // Update state with the existing gateway for the next element
        updateCurrentState(existingExclusiveGateway.bpmnElement, existingExclusiveGateway.bounds);
      } else {
        const exclusiveGateway = criarGatewayExclusivo(
          moddle,
          bpmnProcess,
          bpmnPlane,
          currentElement,
          currentBounds,
          participantBounds,
          participants,
          laneHeight,
          name,
          lane
        );

        const positions = calcularPosicoesDivergencia(
          diverge,
          currentBounds,
          participantBounds,
          participants,
          laneHeight,
          lane
        );

        addMultiplePositions(exclusiveGateway, positions);
      }
      break;

    case 'Gateway Paralelo':
      const existingParallelGateway = buscarGatewayExistente(bpmnPlane, 'ParallelGateway', name);

      if (existingParallelGateway) {
        conectarGatewayParaleloExistente(
          moddle,
          bpmnProcess,
          bpmnPlane,
          currentElement,
          currentBounds,
          existingParallelGateway
        );
        
        // Update state with the existing gateway for the next element
        updateCurrentState(existingParallelGateway.bpmnElement, existingParallelGateway.bounds);
      } else {
        const parallelGateway = criarGatewayParalelo(
          moddle,
          bpmnProcess,
          bpmnPlane,
          currentElement,
          currentBounds,
          participantBounds,
          participants,
          laneHeight,
          name,
          lane
        );

        const positions = calcularPosicoesDivergencia(
          diverge,
          currentBounds,
          participantBounds,
          participants,
          laneHeight,
          lane
        );

        addMultiplePositions(parallelGateway, positions);
      }
      break;

    case 'Data Object':
      const dataObjectDirection = name.split('_')[0];
      name = name.split('_')[1];
      criarDataObject(
        moddle,
        bpmnProcess,
        bpmnPlane,
        currentElement,
        currentBounds,
        name,
        dataObjectDirection
      );
      updateCurrentState(currentElement, currentBounds);
      break;

    case 'Fim':
      eventType = name.split('_')[0];
      name = name.split('_')[1];
      criarEventoFinal(
        moddle,
        bpmnProcess,
        bpmnPlane,
        currentElement,
        currentBounds,
        participantBounds,
        participants,
        laneHeight,
        eventType,
        name,
        lane
      );
      break;

    default:
      console.error('Unknown element type:', type);
  }
}
