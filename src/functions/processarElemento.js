import criarAtividade from './criarAtividade.js';
import criarEventoIntermediario from './criarEventoIntermediario.js';
import criarGatewayExclusivo from './criarGatewayExclusivo.js';
import criarGatewayParalelo from './criarGatewayParalelo.js';
import criarEventoInicial from './criarEventoInicial.js';
import criarEventoFinal from './criarEventoFinal.js';
import criarDataObject from './criarDataObject.js';
import criarFluxoMensagem from './criarFluxoMensagem.js';
import conectarGatewayExclusivoExistente from './conectarGatewayExclusivoExistente.js';
import conectarGatewayParaleloExistente from './conectarGatewayParaleloExistente.js';
import buscarGatewayExistente from './buscarGatewayExistente.js';

export default function processarElemento(
  element,
  moddle,
  bpmnProcess,
  bpmnPlane,
  collaboration,
  dictEntry,
  participantBounds,
  participants,
  laneHeight,
  externalParticipants,
  elements,
  yOffset
) {

  let { type, name, lane, diverge } = element;
  let eventType = '';
  let activityType = '';

  switch (type) {
    case 'Inicio':
      dictEntry = criarEventoInicial(
        moddle,
        bpmnProcess,
        bpmnPlane,
        participantBounds,
        participants,
        laneHeight,
        name,
        lane,
        yOffset
      );
      break;

    case 'Atividade':
      activityType = name.split('_')[0];
      name = name.split('_')[1];
      dictEntry = criarAtividade(
        moddle,
        bpmnProcess,
        bpmnPlane,
        participantBounds,
        participants,
        laneHeight,
        activityType,
        name,
        lane,
        dictEntry,
        yOffset
      );
      break;

    case 'Evento Intermediario':
      eventType = name.split('_')[0];
      name = name.split('_')[1];
      dictEntry = criarEventoIntermediario(
        moddle,
        bpmnProcess,
        bpmnPlane,
        participantBounds,
        participants,
        laneHeight,
        eventType,
        name,
        lane,
        dictEntry,
        yOffset
      );
      break;

    case 'Gateway Exclusivo':
      const divergeEntry = [];

      divergeEntry.push(criarGatewayExclusivo(
        moddle,
        bpmnProcess,
        bpmnPlane,
        participantBounds,
        participants,
        laneHeight,
        name,
        lane,
        dictEntry,
        yOffset
      ));

      const pontos = distribuirPontosDivergencia(diverge.length, yOffset);
      
      diverge.forEach((branchIndex, divergeIndex) => {
        const branchYOffset = pontos[divergeIndex];
        divergeEntry.push(processarElemento(
          elements[branchIndex],
          moddle,
          bpmnProcess,
          bpmnPlane,
          collaboration,
          divergeEntry[0],
          participantBounds,
          participants,
          laneHeight,
          externalParticipants,
          elements,
          branchYOffset
        ));
        const startIndex = branchIndex + 1;
        const endIndex = divergeIndex < diverge.length - 1 ? diverge[divergeIndex + 1] : elements.length;

        for (let i = startIndex; i < endIndex; i++) {
          divergeEntry.push(processarElemento(
            elements[i],
            moddle,
            bpmnProcess,
            bpmnPlane,
            collaboration,
            divergeEntry[divergeEntry.length - 1],
            participantBounds,
            participants,
            laneHeight,
            externalParticipants,
            elements,
            branchYOffset
          ));
        }
      });

      dictEntry = divergeEntry;
      break;

    case 'Gateway Paralelo':
      break;

    case 'Data Object':
      const dataObjectDirection = name.split('_')[0];
      name = name.split('_')[1];
      criarDataObject(
        moddle,
        bpmnProcess,
        bpmnPlane,
        dictEntry,
        name,
        dataObjectDirection
      );
      break;

    case 'Mensagem':
      const messageType = name.split('_')[0];
      criarFluxoMensagem(
        moddle,
        collaboration,
        bpmnPlane,
        dictEntry,
        externalParticipants,
        participantBounds,
        messageType,
        lane
      );
      break;

    case 'Fim':
      eventType = name.split('_')[0];
      name = name.split('_')[1];
      dictEntry = criarEventoFinal(
        moddle,
        bpmnProcess,
        bpmnPlane,
        participantBounds,
        participants,
        laneHeight,
        eventType,
        name,
        lane,
        dictEntry,
        yOffset
      );
      break;

    default:
      console.error('Unknown element type:', type);
  }

  return dictEntry;
}

function distribuirPontosDivergencia(x, offsetBase = 0) {
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



