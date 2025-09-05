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
        dictEntry,
        positionConfig,
        gatewayPai
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
        positionConfig
      ));

      // Se tem divergências, registra usando as regras originais
      if (diverge && diverge.length > 0) {
        const gatewayId = `gateway_${index}`;

        gerenciadorDivergencias.registrarDivergencia(
          gatewayId,
          diverge,
          divergeEntry[0].get("bounds"),
          participantBounds,
          participants,
          laneHeight,
          lane
        );
      }

      // Processa cada branch completo
      diverge.forEach((branchIndex, branchNum) => {
        let currentElement = divergeEntry[0]; // Gateway como elemento anterior inicial

        // Determina onde termina este branch (próximo branch ou fim do array)
        const nextBranchIndex = branchNum < diverge.length - 1 ? diverge[branchNum + 1] : elements.length;

        // Processa todos os elementos deste branch
        for (let i = branchIndex; i < nextBranchIndex; i++) {
          // Para elementos após o primeiro do branch, herda configuração do anterior
          if (i > branchIndex && currentElement) {
            // Herda a configuração de posição do elemento anterior
            const configAnterior = gerenciadorDivergencias.obterConfiguracaoCompleta(currentElement.index || branchIndex);
            if (configAnterior) {
              gerenciadorDivergencias.registrarConfiguracaoHerdada(i, configAnterior);
            }
          }

          const processedElement = processarElemento(
            elements[i],
            moddle,
            bpmnProcess,
            bpmnPlane,
            collaboration,
            currentElement, 
            participantBounds,
            participants,
            laneHeight,
            externalParticipants,
            elements
          );

          // Se é o primeiro elemento do branch, adiciona ao divergeEntry
          if (i === branchIndex) {
            divergeEntry.push(processedElement);
          }

          // Atualiza o elemento anterior para o próximo elemento
          currentElement = processedElement;
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
        positionConfig,
        gatewayPai
      );
      break;

    default:
      console.error('Unknown element type:', type);
  }

  return dictEntry;
}
