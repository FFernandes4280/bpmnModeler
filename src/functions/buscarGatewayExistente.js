export default function buscarGatewayExistente(bpmnPlane, gatewayType, name) {
  return bpmnPlane.planeElement.find(
    (e) => e.bpmnElement.id === `${gatewayType}_${name}` && e.bpmnElement.$type === `bpmn:${gatewayType}`
  );
}
