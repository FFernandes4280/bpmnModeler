import criarAtividade from './criarAtividade.js';
import criarEventoIntermediario from './criarEventoIntermediario.js';
import criarGatewayExclusivo from './criarGatewayExclusivo.js';
import criarGatewayParalelo from './criarGatewayParalelo.js';
import criarEventoInicial from './criarEventoInicial.js';
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
  elementsList,
  participantBounds,
  participants,
  laneHeight,
  externalParticipants
) {

  let { index, type, name, lane, diverge } = element;
  let eventType = '';
  let activityType = '';
  console.log(elementsList)
  switch (type) {
    case 'Inicio':
      criarEventoInicial(
        moddle,
        bpmnProcess,
        bpmnPlane,
        participantBounds,
        participants,
        laneHeight,
        name,
        lane,
        elementsList
      );
      break;

    case 'Atividade':
      activityType = name.split('_')[0];
      name = name.split('_')[1];
      criarAtividade(
        moddle,
        bpmnProcess,
        bpmnPlane,
        participantBounds,
        participants,
        laneHeight,
        activityType,
        name,
        lane,
        index,
        elementsList
      );
      break;

    case 'Evento Intermediario':
      eventType = name.split('_')[0];
      name = name.split('_')[1];
      criarEventoIntermediario(
        moddle,
        bpmnProcess,
        bpmnPlane,
        participantBounds,
        participants,
        laneHeight,
        eventType,
        name,
        lane,
        index,
        elementsList
      );
      break;

    // case 'Gateway Exclusivo':
    //   const existingExclusiveGateway = buscarGatewayExistente(bpmnPlane, 'ExclusiveGateway', name);

    //   if (existingExclusiveGateway) {
    //     conectarGatewayExclusivoExistente(
    //       moddle,
    //       bpmnProcess,
    //       bpmnPlane,
    //       currentElement,
    //       currentBounds,
    //       existingExclusiveGateway,
    //       elementTracker.get('nextPositions')
    //     );

    //     // Update state with the existing gateway for the next element
    //   } else {
    //     const exclusiveGateway = criarGatewayExclusivo(
    //       moddle,
    //       bpmnProcess,
    //       bpmnPlane,
    //       currentElement,
    //       currentBounds,
    //       participantBounds,
    //       participants,
    //       laneHeight,
    //       name,
    //       lane
    //     );

    //     const positions = calcularPosicoesDivergencia(
    //       diverge,
    //       currentBounds,
    //       participantBounds,
    //       participants,
    //       laneHeight,
    //       lane
    //     );

    //     addMultiplePositions(exclusiveGateway, positions);
    //   }
    //   break;

    // case 'Gateway Paralelo':
    //   const existingParallelGateway = buscarGatewayExistente(bpmnPlane, 'ParallelGateway', name);

    //   if (existingParallelGateway) {
    //     conectarGatewayParaleloExistente(
    //       moddle,
    //       bpmnProcess,
    //       bpmnPlane,
    //       currentElement,
    //       currentBounds,
    //       existingParallelGateway
    //     );

    //     // Update state with the existing gateway for the next element
    //   } else {
    //     const parallelGateway = criarGatewayParalelo(
    //       moddle,
    //       bpmnProcess,
    //       bpmnPlane,
    //       currentElement,
    //       currentBounds,
    //       participantBounds,
    //       participants,
    //       laneHeight,
    //       name,
    //       lane
    //     );

    //     const positions = calcularPosicoesDivergencia(
    //       diverge,
    //       currentBounds,
    //       participantBounds,
    //       participants,
    //       laneHeight,
    //       lane
    //     );

    //     addMultiplePositions(parallelGateway, positions);
    //   }
    //   break;

    // case 'Data Object':
    //   const dataObjectDirection = name.split('_')[0];
    //   name = name.split('_')[1];
    //   criarDataObject(
    //     moddle,
    //     bpmnProcess,
    //     bpmnPlane,
    //     currentElement,
    //     currentBounds,
    //     name,
    //     dataObjectDirection
    //   );
    //   break;

    // case 'Mensagem':
    //   criarFluxoMensagem(
    //     moddle,
    //     collaboration,
    //     bpmnPlane,
    //     currentElement,
    //     currentBounds,
    //     externalParticipants,
    //     participantBounds,
    //     name,
    //     lane
    //   );
    //   break;

    case 'Fim':
      eventType = name.split('_')[0];
      name = name.split('_')[1];
      criarEventoFinal(
        moddle,
        bpmnProcess,
        bpmnPlane,
        participantBounds,
        participants,
        laneHeight,
        eventType,
        name,
        lane,
        index,
        elementsList
      );
      break;

    default:
      console.error('Unknown element type:', type);
  }
}
