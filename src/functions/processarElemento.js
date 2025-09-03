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
import { gerenciadorDivergencias } from './gerenciarDivergencias.js';

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
  elements
) {

  let { index, type, name, lane, diverge } = element;
  let eventType = '';
  let activityType = '';
  
  const positionConfig = gerenciadorDivergencias.obterConfiguracaoCompleta(index);
  const gatewayPai = gerenciadorDivergencias.ehPrimeiroElementoBranch(index);

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
        lane
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
        index,
        dictEntry,
        positionConfig,
        gatewayPai
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
        index,
        dictEntry,
        positionConfig,
        gatewayPai
      );
      break;

    case 'Gateway Exclusivo':
      // Primeiro cria o gateway e obtém seus bounds
      const gatewayBounds = criarGatewayExclusivo(
        moddle,
        bpmnProcess,
        bpmnPlane,
        participantBounds,
        participants,
        laneHeight,
        name,
        lane,
        index,
        elementsList,
        positionConfig
      );

      // Se tem divergências, registra usando as regras originais
      if (diverge && diverge.length > 0) {
        const gatewayId = `gateway_${index}`;
        
        gerenciadorDivergencias.registrarDivergencia(
          gatewayId, 
          diverge, 
          gatewayBounds,  // currentBounds
          participantBounds, 
          participants, 
          laneHeight, 
          lane
        );
      }

      // Processa elementos dos branches
      diverge.forEach((branchIndex) => {
        processarElemento(
          elements[branchIndex],
          moddle,
          bpmnProcess,
          bpmnPlane,
          collaboration,
          elementsList,
          participantBounds,
          participants,
          laneHeight,
          externalParticipants,
          elements
        );
      });

      break;

    case 'Gateway Paralelo':
      // Primeiro cria o gateway e obtém seus bounds
      const gatewayParaleloBounds = criarGatewayParalelo(
        moddle,
        bpmnProcess,
        bpmnPlane,
        participantBounds,
        participants,
        laneHeight,
        name,
        lane,
        index,
        elementsList,
        positionConfig
      );

      // Se tem divergências, registra usando as regras originais
      if (diverge && diverge.length > 0) {
        const gatewayId = `gateway_paralelo_${index}`;
        
        gerenciadorDivergencias.registrarDivergencia(
          gatewayId, 
          diverge, 
          gatewayParaleloBounds,
          participantBounds, 
          participants, 
          laneHeight, 
          lane
        );
      }

      // Processa elementos dos branches
      diverge.forEach((branchIndex) => {
        processarElemento(
          elements[branchIndex],
          moddle,
          bpmnProcess,
          bpmnPlane,
          collaboration,
          elementsList,
          participantBounds,
          participants,
          laneHeight,
          externalParticipants,
          elements
        );
      });
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
        dictEntry,
        positionConfig,
        gatewayPai
      );
      break;

    default:
      console.error('Unknown element type:', type);
  }

  return dictEntry;
}
