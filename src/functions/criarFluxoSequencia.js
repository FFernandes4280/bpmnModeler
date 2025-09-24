// Mapa para IDs específicos de fluxos de retorno
const returnFlowIds = new Map();

export default function criarFluxoSequencia(
  moddle,
  bpmnProcess,
  bpmnPlane,
  sourceElement,
  targetElement,
  waypoints,
  isReturnFlow = false
) {
  // Determinar ID do fluxo
  let flowId;
  if (isReturnFlow) {
    // Para fluxos de retorno, usar IDs específicos baseados nos elementos
    const sourceId = sourceElement.id;
    const targetId = targetElement.id;
    
    if (sourceId === 'Task_Corrigir_falhas') {
      flowId = 'Flow_0gkkofe';
    } else if (sourceId === 'IntermediateThrowEvent_Artigo_com_formatao_reprovada') {
      flowId = 'Flow_144zno9';
    } else if (sourceId === 'IntermediateThrowEvent_Kit_rejeitado' && targetId === 'ExclusiveGateway_followingDefault_Separar_as_peas') {
      flowId = 'Flow_9e5igho';
    } else {
      // Para outros casos, gerar ID simples baseado nos nomes dos elementos
      flowId = `Flow_${sourceId.slice(-7)}_${targetId.slice(-7)}`;
    }
  } else {
    // Para fluxos normais, manter o padrão atual
    flowId = `SequenceFlow_${sourceElement.id}_${targetElement.id}`;
  }

  // Cria o fluxo de sequência
  const sequenceFlow = moddle.create('bpmn:SequenceFlow', {
    id: flowId,
    sourceRef: sourceElement,
    targetRef: targetElement,
  });

  // Adiciona outgoing ao elemento source
  if (!sourceElement.outgoing) {
    sourceElement.outgoing = [];
  }
  sourceElement.outgoing.push(sequenceFlow);

  // Adiciona incoming ao elemento target
  if (!targetElement.incoming) {
    targetElement.incoming = [];
  }
  targetElement.incoming.push(sequenceFlow);

  // Adiciona o fluxo de sequência ao processo
  bpmnProcess.get('flowElements').push(sequenceFlow);

  // Cria o BPMNEdge para o fluxo de sequência
  const sequenceFlowEdge = moddle.create('bpmndi:BPMNEdge', {
    id: `${flowId}_di`,
    bpmnElement: sequenceFlow,
    waypoint: waypoints,
  });

  // Adiciona o edge ao BPMNPlane
  bpmnPlane.planeElement.push(sequenceFlowEdge);

  return {
    sequenceFlow,
    sequenceFlowEdge
  };
}
