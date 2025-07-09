import criarFluxoSequencia from './criarFluxoSequencia.js';
import calcularWaypointsSequenceFlow from './calcularWaypointsSequenceFlow.js';

export default function conectarGatewayParaleloExistente(
  moddle,
  bpmnProcess,
  bpmnPlane,
  currentElement,
  currentBounds,
  existingGateway
) {
  // Calcula waypoints usando a nova função
  const sequenceFlowWaypoints = calcularWaypointsSequenceFlow(
    moddle,
    currentBounds,
    existingGateway.bounds
  );

  return criarFluxoSequencia(
    moddle,
    bpmnProcess,
    bpmnPlane,
    currentElement,
    existingGateway.bpmnElement,
    sequenceFlowWaypoints
  );
}
