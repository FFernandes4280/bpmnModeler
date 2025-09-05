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
      const processedElementsInThisGateway = new Set(); // Rastreia elementos já processados

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

        // Processa cada branch completo
        diverge.forEach((branchIndex, branchNum) => {
          let currentElement = divergeEntry[0]; // Gateway como elemento anterior inicial

          // Determina onde termina este branch (próximo branch ou fim do array)
          const nextBranchIndex = branchNum < diverge.length - 1 ? diverge[branchNum + 1] : elements.length;

          for (let i = branchIndex; i < nextBranchIndex; i++) {
            // PULA elementos já processados por gateways anteriores
            if (processedElementsInThisGateway.has(i)) {
              continue;
            }

            // Marca este elemento como processado
            processedElementsInThisGateway.add(i);

            if (i > branchIndex && currentElement) {
              // Garante que currentElement seja um Map, não um array
              const elementIndex = Array.isArray(currentElement) ? 
                (currentElement[0]?.get ? currentElement[0].get("element")?.index : branchIndex) :
                (currentElement.get ? currentElement.get("element")?.index : branchIndex);

              const configAnterior = gerenciadorDivergencias.obterConfiguracaoCompleta(elementIndex || branchIndex);
              if (configAnterior) {
                gerenciadorDivergencias.registrarConfiguracaoHerdada(i, configAnterior);
              }
            }

            // Cria uma substring dos elements limitada à branch atual
            // Para evitar que gateways aninhados processem elementos fora de sua branch
            const branchElements = elements.slice(0, nextBranchIndex);

            const processedElement = processarElemento(
              elements[i],
              moddle,
              bpmnProcess,
              bpmnPlane,
              collaboration,
              Array.isArray(currentElement) ? currentElement[0] : currentElement, // Usa só o primeiro se for array
              participantBounds,
              participants,
              laneHeight,
              externalParticipants,
              branchElements // Passa apenas os elementos até o fim desta branch
            );

            // Se é o primeiro elemento do branch, adiciona ao divergeEntry
            if (i === branchIndex) {
              divergeEntry.push(processedElement);
            }

            // Atualiza o elemento anterior para o próximo elemento
            // Se processedElement for array (outro gateway), usa o primeiro elemento
            currentElement = Array.isArray(processedElement) ? processedElement[0] : processedElement;

            // Se o elemento processado foi um gateway com divergências,
            // marca todos os elementos processados por ele como já processados
            if (Array.isArray(processedElement) && elements[i].diverge && elements[i].diverge.length > 0) {
              elements[i].diverge.forEach(subBranchIndex => {
                const subNextBranchIndex = elements[i].diverge[elements[i].diverge.indexOf(subBranchIndex) + 1] || nextBranchIndex;
                for (let j = subBranchIndex; j < subNextBranchIndex; j++) {
                  processedElementsInThisGateway.add(j);
                }
              });
            }
          }
        });
      }

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
