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
import { distribuirPontosDivergencia } from './distribuirPontosDivergencia.js';
import criarFluxoSequencia from './criarFluxoSequencia.js';
import calcularWaypointsFluxoReverso from './calcularWaypointsFluxoReverso.js';

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

      // Encontra o índice do gateway atual no array de elementos
      const currentGatewayIndex = elements.findIndex(el =>
        el.type === element.type &&
        el.name === element.name &&
        el.lane === element.lane
      );

      const pontos = distribuirPontosDivergencia(diverge.length, yOffset, elements, currentGatewayIndex);

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
        const endIndex = findElementToStop(elements, diverge[0] - 1, divergeIndex, diverge.length);

        for (let i = startIndex; i < endIndex; i++) {
          const currentEntry = processarElemento(
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
          );
          if (Array.isArray(currentEntry)) {
            divergeEntry.push(...currentEntry);
          } else {
            divergeEntry.push(currentEntry);
          }
          if (elements[i].type === 'Gateway Exclusivo' ||
            elements[i].type === 'Gateway Paralelo') break;
        }
      });

      dictEntry = divergeEntry;
      break;

    case 'Gateway Paralelo':
      break;

    case 'Data Object':
      const dataObjectDirection = name.split('_')[0];
      name = name.split('_')[1];
      dictEntry = criarDataObject(
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

    case 'Gateway Existente':
      // Gateway Existente agora vem com o nome correto do gateway de destino
      const targetName = element.name;
      let targetIndex = -1;

      // Busca o gateway de destino pelo nome
      for (let i = 0; i < elements.length; i++) {
        if ((elements[i].type === 'Gateway Exclusivo' || elements[i].type === 'Gateway Paralelo') &&
          elements[i].name === targetName && elements[i].lane === element.lane) {
          targetIndex = i;
          break;
        }
      }

      if (targetIndex !== -1 && dictEntry) {
        // Busca o elemento já processado no bpmnProcess
        const targetElement = elements[targetIndex];
        let targetDict = null;
        let targetShape = null;

        // Busca no processo BPMN pelo elemento já criado
        const flowElements = bpmnProcess.get('flowElements');
        for (let flowElement of flowElements) {
          if (flowElement.name === targetElement.name || flowElement.id.includes(targetElement.name)) {
            targetDict = flowElement;
            break;
          }
        }

        // Busca a shape do target no bpmnPlane para obter bounds
        if (targetDict) {
          const planeElements = bpmnPlane.planeElement;
          for (let planeElement of planeElements) {
            if (planeElement.bpmnElement && planeElement.bpmnElement.id === targetDict.id) {
              targetShape = planeElement;
              break;
            }
          }
        }

        if (targetDict && targetShape) {
          const sourceDict = Array.isArray(dictEntry) ? dictEntry[dictEntry.length - 1] : dictEntry;
          
          // sourceDict já é um BPMNShape que contém bounds e bpmnElement
          if (sourceDict && sourceDict.bounds) {
            // Calcula waypoints para fluxo reverso (Gateway Existente)
            const reverseWaypoints = calcularWaypointsFluxoReverso(
              moddle,
              sourceDict.bounds,
              targetShape.bounds
            );

            // Cria o fluxo de sequência com waypoints calculados
            criarFluxoSequencia(
              moddle,
              bpmnProcess,
              bpmnPlane,
              sourceDict.bpmnElement,
              targetDict,
              reverseWaypoints,
              true // isReturnFlow = true para gateways existentes
            );
          } else {
            console.warn('sourceDict ou bounds não encontrados para Gateway Existente');
          }
        } else {
          console.warn('Elemento ou shape do gateway de destino não encontrados:', targetName);
        }
      } else {
        console.warn('Gateway de destino não encontrado:', targetName, 'na lane:', element.lane);
      }

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

function findElementToStop(elements, gatewayIndex, divergeIndex, divergeLength) {
  if (divergeIndex < divergeLength - 1) {
    return elements[gatewayIndex].diverge[divergeIndex + 1];
  }

  for (let i = gatewayIndex - 1; i > 0; i--) {
    if (elements[i] && (elements[i].type === 'Gateway Exclusivo' || elements[i].type === 'Gateway Paralelo')) {
      // Encontra em qual branch do gateway anterior o gateway atual está
      let indexInDiverge = -1;
      for (let branchIdx = 0; branchIdx < elements[i].diverge.length; branchIdx++) {
        const branchStart = elements[i].diverge[branchIdx] - 1; // Converte para índice baseado em 0
        const branchEnd = branchIdx < elements[i].diverge.length - 1 ?
          elements[i].diverge[branchIdx + 1] - 1 : elements.length;

        if (gatewayIndex + 1 >= branchStart && gatewayIndex + 1 < branchEnd) {
          indexInDiverge = branchIdx;
          break;
        }
      }

      let prevDiverLength = elements[i].diverge.length;
      if (indexInDiverge !== -1 && indexInDiverge < prevDiverLength - 1) {
        return elements[i].diverge[indexInDiverge + 1];
      }

      gatewayIndex = i;
      divergeIndex = indexInDiverge;
      divergeLength = prevDiverLength;
      i = gatewayIndex;
    }
  }

  return elements.length;
}




