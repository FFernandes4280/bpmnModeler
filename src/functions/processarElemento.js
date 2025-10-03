import criarAtividade from './criarAtividade.js';
import criarEventoIntermediario from './criarEventoIntermediario.js';
import criarGatewayExclusivo from './criarGatewayExclusivo.js';
import criarGatewayParalelo from './criarGatewayParalelo.js';
import criarEventoInicial from './criarEventoInicial.js';
import criarEventoFinal from './criarEventoFinal.js';
import criarDataObject from './criarDataObject.js';
import criarFluxoMensagem from './criarFluxoMensagem.js';
import { distribuirPontosDivergencia } from './distribuirPontosDivergencia.js';
import criarFluxoSequencia from './criarFluxoSequencia.js';
import calcularWaypointsFluxoReverso from './calcularWaypointsFluxoReverso.js';

// Constantes para tipos de elementos
const GATEWAY_TYPES = {
  EXCLUSIVE: 'Gateway Exclusivo',
  PARALLEL: 'Gateway Paralelo'
};

// Helper para verificar se é um tipo de gateway
const isGatewayType = (type) => 
  type === GATEWAY_TYPES.EXCLUSIVE || type === GATEWAY_TYPES.PARALLEL;

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
  yOffset,
  maxProcessingIndex = elements.length // Limite máximo de processamento para esta branch
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

    case GATEWAY_TYPES.EXCLUSIVE:
    case GATEWAY_TYPES.PARALLEL:
      // Função auxiliar para processar gateways (exclusivo ou paralelo)
      const processGateway = (gatewayCreator) => {
        const divergeEntry = [];

        // Cria o gateway inicial (exclusivo ou paralelo)
        divergeEntry.push(gatewayCreator(
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

        // Se não tem diverge, é um gateway de convergência - apenas retorna o gateway criado
        if (!diverge || diverge.length === 0) {
          return divergeEntry[0];
        }

        // Encontra o índice do gateway atual no array de elementos
        const currentGatewayIndex = elements.findIndex(el =>
          el.type === element.type &&
          el.name === element.name &&
          el.lane === element.lane
        );

        const pontos = distribuirPontosDivergencia(diverge.length, yOffset, elements, currentGatewayIndex);

        diverge.forEach((branchIndex, divergeIndex) => {
          if (!elements[branchIndex]) {
            return; // Skip este branch
          }
          
          // Valida que a branch não aponta para o próprio gateway (evita recursão infinita)
          if (branchIndex === currentGatewayIndex) {
            console.warn(`⚠️ Gateway "${element.name}" tem diverge apontando para si mesmo (índice ${branchIndex}). Pulando branch.`);
            return;
          }
          
          const branchYOffset = pontos[divergeIndex];
          const firstBranchElement = elements[branchIndex];
          
          // Calcula o limite de processamento para esta branch:
          // - Se não for a última branch, o limite é o início da próxima branch
          // - Se for a última branch, usa o maxProcessingIndex recebido como parâmetro
          const branchLimit = divergeIndex < diverge.length - 1 
            ? diverge[divergeIndex + 1]  // Início da próxima branch
            : maxProcessingIndex;         // Limite do gateway pai
          
          // Processa o primeiro elemento da branch
          divergeEntry.push(processarElemento(
            firstBranchElement,
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
            branchYOffset,
            branchLimit // Passa o limite para o elemento filho
          ));
          
          // Se o primeiro elemento é um gateway, ele já processou todos os seus elementos recursivamente
          // Então não devemos processar os elementos seguintes nesta branch
          if (isGatewayType(firstBranchElement.type)) {
            return; // Pula o loop - gateway já processou tudo
          }
          
          const startIndex = branchIndex + 1;
          const endIndex = Math.min(branchLimit, findElementToStop(elements, diverge[0] - 1, divergeIndex, diverge.length));

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
              branchYOffset,
              branchLimit // Passa o limite para elementos subsequentes
            );
            if (Array.isArray(currentEntry)) {
              divergeEntry.push(...currentEntry);
            } else {
              divergeEntry.push(currentEntry);
            }
            // Para apenas se encontrar um gateway DE DIVERGÊNCIA (com diverge)
            // Gateways de convergência (sem diverge) devem continuar o fluxo
            if (isGatewayType(elements[i].type) && elements[i].diverge && elements[i].diverge.length > 0) {
              break;
            }
          }
        });

        return divergeEntry;
      };

      // Chama a função auxiliar com o criador apropriado
      dictEntry = type === GATEWAY_TYPES.EXCLUSIVE
        ? processGateway(criarGatewayExclusivo)
        : processGateway(criarGatewayParalelo);
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
      dictEntry = criarFluxoMensagem(
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
      // Gateway Existente será processado em uma segunda passada
      // Por enquanto, apenas retorna o dictEntry sem criar conexão
      // Isso evita problemas de ordem quando o gateway de destino ainda não foi criado
      break;

    case 'Gateway Existente (segunda passada)':
      // Gateway Existente agora vem com o nome correto do gateway de destino
      const targetName = element.name;
      
      // Busca o gateway de destino pelo nome
      const targetIndex = elements.findIndex((el) => 
        isGatewayType(el.type) && el.name === targetName && el.lane === element.lane
      );

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
          }
        }
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
      break;
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




