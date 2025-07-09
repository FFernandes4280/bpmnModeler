export default function criarFluxoSequencia(
  moddle,
  bpmnProcess,
  bpmnPlane,
  sourceElement,
  targetElement,
  waypoints
) {
  // Cria o fluxo de sequência
  const sequenceFlow = moddle.create('bpmn:SequenceFlow', {
    id: `SequenceFlow_${sourceElement.id}_to_${targetElement.id}`,
    sourceRef: sourceElement,
    targetRef: targetElement,
  });

  // Adiciona o fluxo de sequência ao processo
  bpmnProcess.get('flowElements').push(sequenceFlow);

  // Cria o BPMNEdge para o fluxo de sequência
  const sequenceFlowEdge = moddle.create('bpmndi:BPMNEdge', {
    id: `SequenceFlow_${sourceElement.id}_to_${targetElement.id}_di`,
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
