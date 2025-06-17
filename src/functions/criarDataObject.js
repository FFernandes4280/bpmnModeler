export default function criarDataObject(
    moddle,
    bpmnProcess,
    bpmnPlane,
    currentElement,
    currentBounds,
    name
) {
    const dataObject = moddle.create('bpmn:DataObject', {
        id: `DataObject_${name.replace(/\s+/g, '_')}`,
        name: name,
    });

    const dataObjectRef = moddle.create('bpmn:DataObjectReference', {
        id: `DataObjectReference_${name.replace(/\s+/g, '_')}`,
        dataObjectRef: dataObject,
        name: name,
    });

    bpmnProcess.get('flowElements').push(dataObject);
    bpmnProcess.get('flowElements').push(dataObjectRef);

    const dataObjectBounds = {
        x: currentBounds.x,
        y: currentBounds.y - 70,
        width: 36,
        height: 48,
    };

    const dataObjectShape = moddle.create('bpmndi:BPMNShape', {
        id: `DataObjectReference_${name.replace(/\s+/g, '_')}_di`,
        bpmnElement: dataObjectRef,
        bounds: moddle.create('dc:Bounds', dataObjectBounds),
        isExpanded: true,
    });

    bpmnPlane.planeElement.push(dataObjectShape);


    const dataAssociation = moddle.create('bpmn:DataOutputAssociation', {
        id: `DataOutputAssociation_${currentElement.id}_to_${dataObjectRef.id}`,
        targetRef: dataObjectRef,
    });

    if (!currentElement.dataOutputAssociations) {
        currentElement.dataOutputAssociations = [];
    }
    currentElement.dataOutputAssociations.push(dataAssociation);

    const associationWaypoints = [
        moddle.create('dc:Point', { x: currentBounds.x + currentBounds.width /2 , y: currentBounds.y}),
        moddle.create('dc:Point', { x: dataObjectBounds.x + dataObjectBounds.width /2, y: dataObjectBounds.y + dataObjectBounds.height }),
    ];
    const associationEdge = moddle.create('bpmndi:BPMNEdge', {
        id: `DataOutputAssociation_${currentElement.id}_to_${dataObjectRef.id}_di`,
        bpmnElement: dataAssociation,
        waypoint: associationWaypoints,
    });
    bpmnPlane.planeElement.push(associationEdge);

    const labelHeight = 14;
    const labelWidth = Math.max(36, name.length * 7); 

    const dataObjectLabel = moddle.create('bpmndi:BPMNLabel', {
      bounds: moddle.create('dc:Bounds', {
        x: dataObjectBounds.x + (dataObjectBounds.width - labelWidth) / 2,
        y: dataObjectBounds.y - labelHeight - 2, 
        width: labelWidth,
        height: labelHeight,
      }),
    });

    dataObjectShape.label = dataObjectLabel;
}