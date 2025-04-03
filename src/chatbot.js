import BpmnModdle from 'bpmn-moddle';

const moddle = new BpmnModdle();

const xmlStart =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" ' +
                     'xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" ' +
                     'xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" ' +
                     'xmlns:di="http://www.omg.org/spec/DD/20100524/DI" ' +
                     'id="Definitions_1a88msi" ' +
                     'targetNamespace="http://bpmn.io/schema/bpmn">' +
  '</bpmn2:definitions>';

async function generateDiagram() {
  const { rootElement: definitions } = await moddle.fromXML(xmlStart);

  // Create the process
  const bpmnProcess = moddle.create('bpmn:Process', { id: 'Process', isExecutable: false });
  definitions.get('rootElements').push(bpmnProcess);
  
  // Create the lane set
  const laneSet = moddle.create('bpmn:LaneSet', { id: 'LaneSet' });
  bpmnProcess.get('laneSets').push(laneSet);

  // Define project name and participants
  let projectName = 'Projeto de Teste';
  let participants = [];
  let participantNumber = 4;

  // Create collaboration and participant
  const collaboration = moddle.create('bpmn:Collaboration', { id: 'Collaboration' });
  const participant = moddle.create('bpmn:Participant', {
    id: 'Participant',
    name: projectName,
    processRef: bpmnProcess,
  });
  collaboration.get('participants').push(participant);
  definitions.get('rootElements').push(collaboration);

  // Create the BPMNDiagram and BPMNPlane
  const bpmnDiagram = moddle.create('bpmndi:BPMNDiagram', { id: 'BPMNDiagram' });
  const bpmnPlane = moddle.create('bpmndi:BPMNPlane', { id: 'BPMNPlane', bpmnElement: collaboration });
  bpmnPlane.planeElement = [];
    
  // Create a participant shape for the process
  const participantShape = moddle.create('bpmndi:BPMNShape', {
    id: 'Participant_di',
    bpmnElement: participant,
    isHorizontal: true,
    bounds: moddle.create('dc:Bounds', { x: 160, y: 80, width: 1070, height: 570 }),
  });
  bpmnPlane.planeElement.push(participantShape);

  // Define participant bounds
  const participantBounds = {
    x: 160,
    y: 80,
    width: 1070,
    height: 570,
  };

  // Calculate lane height
  const laneHeight = participantBounds.height / participantNumber;

  // Create lanes and their shapes
  for (let i = 0; i < participantNumber; i++) {
    participants.push(`Lane ${i + 1}`);
    const lane = moddle.create('bpmn:Lane', {
      id: `Lane_${i + 1}`, // Unique ID for each lane
      name: participants[i],
      flowNodeRef: [], // Initialize flowNodeRef as an empty array
    });
    laneSet.get('lanes').push(lane);

    // Create BPMNShape for the lane
    const laneShape = moddle.create('bpmndi:BPMNShape', {
      id: `Lane_${i + 1}_di`,
      bpmnElement: lane,
      isHorizontal: true,
      bounds: moddle.create('dc:Bounds', {
        x: participantBounds.x + 30, // Align with participant (inner margin)
        y: participantBounds.y + i * laneHeight, // Position each lane below the previous one
        width: participantBounds.width - 30, // Adjust width to fit inside participant
        height: laneHeight, // Height of each lane
      }),
    });

    // Add BPMNLabel to the lane shape
    laneShape.label = moddle.create('bpmndi:BPMNLabel', {});

    bpmnPlane.planeElement.push(laneShape);
  }

  bpmnDiagram.plane = bpmnPlane; 
  definitions.get('diagrams').push(bpmnDiagram);

  // Convert the updated definitions back to XML
  const { xml: xmlStrUpdated } = await moddle.toXML(definitions);

  return xmlStrUpdated;
}

// Generate the BPMN diagram and export it
export const diagram = await generateDiagram();
console.log(diagram);