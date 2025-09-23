export default function criarDataObject(
    moddle,
    bpmnProcess,
    bpmnPlane,
    dictEntry,
    name,
    direction
) {
    const normalizedName = name.replace(/\s+/g, '_').replace(/[^\w]/g, '');
    const dataObject = moddle.create('bpmn:DataObject', {
        id: `DataObject_${normalizedName}`,
        name: name,
    });

    const prevShape = dictEntry;
    const prevElement = dictEntry.bpmnElement;

    const dataObjectRef = moddle.create('bpmn:DataObjectReference', {
        id: `DataObjectReference_${normalizedName}`,
        dataObjectRef: dataObject,
        name: name,
    });

    bpmnProcess.get('flowElements').push(dataObject);
    bpmnProcess.get('flowElements').push(dataObjectRef);

    const dataObjectBounds = {
        x: prevShape.bounds.x + (prevShape.bounds.width - 36) / 2,
        y: prevShape.bounds.y - 70,
        width: 36,
        height: 48,
    };

    const dataObjectShape = moddle.create('bpmndi:BPMNShape', {
        id: `DataObjectReference_${normalizedName}_di`,
        bpmnElement: dataObjectRef,
        bounds: moddle.create('dc:Bounds', dataObjectBounds),
        isExpanded: true,
    });

    bpmnPlane.planeElement.push(dataObjectShape);

    // Cria a associação de dados baseada na direção
    let dataAssociation;
    if (direction === 'Envio') {
        dataAssociation = moddle.create('bpmn:DataOutputAssociation', {
            id: `DataOutputAssociation_${prevElement.id}_to_${dataObjectRef.id}`,
            targetRef: dataObjectRef,
        });

        if (!prevElement.dataOutputAssociations) {
            prevElement.dataOutputAssociations = [];
        }
        prevElement.dataOutputAssociations.push(dataAssociation);
    } else {
        // Para DataInputAssociation, precisamos criar uma propriedade no elemento
        const property = moddle.create('bpmn:Property', {
            id: `Property_${prevElement.id}_${dataObjectRef.id}`,
            name: '__targetRef_placeholder'
        });

        // Adiciona a propriedade ao elemento
        if (!prevElement.properties) {
            prevElement.properties = [];
        }
        prevElement.properties.push(property);

        dataAssociation = moddle.create('bpmn:DataInputAssociation', {
            id: `DataInputAssociation_${dataObjectRef.id}_to_${prevElement.id}`,
            targetRef: property,
        });

        // Define o sourceRef separadamente
        dataAssociation.sourceRef = [dataObjectRef];

        if (!prevElement.dataInputAssociations) {
            prevElement.dataInputAssociations = [];
        }
        prevElement.dataInputAssociations.push(dataAssociation);
    }

    // Define os waypoints baseados na direção
    let associationWaypoints;
    if (direction === 'Envio') {
        associationWaypoints = [
            moddle.create('dc:Point', { x: prevShape.bounds.x + prevShape.bounds.width / 2, y: prevShape.bounds.y }),
            moddle.create('dc:Point', { x: dataObjectBounds.x + dataObjectBounds.width / 2, y: dataObjectBounds.y + dataObjectBounds.height }),
        ];
    } else {
        associationWaypoints = [
            moddle.create('dc:Point', { x: dataObjectBounds.x + dataObjectBounds.width / 2, y: dataObjectBounds.y + dataObjectBounds.height }),
            moddle.create('dc:Point', { x: prevShape.bounds.x + prevShape.bounds.width / 2, y: prevShape.bounds.y }),
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
    
    // Retorna o dictEntry original, pois o Data Object não altera a sequência principal
    return dictEntry;
}