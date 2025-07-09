export default function criarDataObject(
    moddle,
    bpmnProcess,
    bpmnPlane,
    currentElement,
    currentBounds,
    name,
    direction = 'Envio'
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
        x: currentBounds.x + (currentBounds.width - 36) / 2, 
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

    // Cria a associação de dados baseada na direção
    let dataAssociation;
    if (direction === 'Envio') {
        dataAssociation = moddle.create('bpmn:DataOutputAssociation', {
            id: `DataOutputAssociation_${currentElement.id}_to_${dataObjectRef.id}`,
            targetRef: dataObjectRef,
        });
        
        if (!currentElement.dataOutputAssociations) {
            currentElement.dataOutputAssociations = [];
        }
        currentElement.dataOutputAssociations.push(dataAssociation);
    } else {
        // Para DataInputAssociation, precisamos criar uma propriedade no elemento
        const property = moddle.create('bpmn:Property', {
            id: `Property_${currentElement.id}_${dataObjectRef.id}`,
            name: '__targetRef_placeholder'
        });
        
        // Adiciona a propriedade ao elemento
        if (!currentElement.properties) {
            currentElement.properties = [];
        }
        currentElement.properties.push(property);
        
        dataAssociation = moddle.create('bpmn:DataInputAssociation', {
            id: `DataInputAssociation_${dataObjectRef.id}_to_${currentElement.id}`,
            targetRef: property,
        });
        
        // Define o sourceRef separadamente
        dataAssociation.sourceRef = [dataObjectRef];
        
        if (!currentElement.dataInputAssociations) {
            currentElement.dataInputAssociations = [];
        }
        currentElement.dataInputAssociations.push(dataAssociation);
    }

    // Define os waypoints baseados na direção
    let associationWaypoints;
    if (direction === 'Envio') {
        associationWaypoints = [
            moddle.create('dc:Point', { x: currentBounds.x + currentBounds.width / 2, y: currentBounds.y }),
            moddle.create('dc:Point', { x: dataObjectBounds.x + dataObjectBounds.width / 2, y: dataObjectBounds.y + dataObjectBounds.height }),
        ];
    } else {
        associationWaypoints = [
            moddle.create('dc:Point', { x: dataObjectBounds.x + dataObjectBounds.width / 2, y: dataObjectBounds.y + dataObjectBounds.height }),
            moddle.create('dc:Point', { x: currentBounds.x + currentBounds.width / 2, y: currentBounds.y }),
        ];
    }

    const associationEdge = moddle.create('bpmndi:BPMNEdge', {
        id: `${dataAssociation.id}_di`,
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