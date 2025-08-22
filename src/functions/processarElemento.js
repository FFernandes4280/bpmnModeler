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
  previousElements,
  previousBounds
) {
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
      previousElements.push(currentElement);
      previousBounds.push(currentBounds);
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
      previousElements.push(activityElement.activity);
      previousBounds.push(activityElement.activityShape.bounds);
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
      previousElements.push(intermediateEvent.intermediateEvent);
      previousBounds.push(intermediateEvent.intermediateEventShape.bounds);
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
          previousElements
        );
        
        // Atualiza os arrays com o gateway existente para o próximo elemento
        previousElements.push(existingExclusiveGateway.bpmnElement);
        previousBounds.push(existingExclusiveGateway.bounds);
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

        for (let i = 0; i < diverge; i++) {
          previousElements.push(exclusiveGateway);
          previousBounds.push(positions[i]);
        }
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
        
        // Atualiza os arrays com o gateway existente para o próximo elemento
        previousElements.push(existingParallelGateway.bpmnElement);
        previousBounds.push(existingParallelGateway.bounds);
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

        for (let i = 0; i < diverge; i++) {
          previousElements.push(parallelGateway);
          previousBounds.push(positions[i]);
        }
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
      previousElements.push(currentElement);
      previousBounds.push(currentBounds);
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
