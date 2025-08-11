export default function criarParticipantesExternos(
  moddle,
  definitions,
  collaboration,
  bpmnPlane,
  externalParticipants,
  participantBounds
) {
  if (!externalParticipants || externalParticipants.length === 0) {
    return;
  }

  externalParticipants.forEach((externalParticipant, index) => {
    const blackBoxBPMNProcess = moddle.create('bpmn:Process', { 
      id: `blackBox_${index}`, 
      isExecutable: false 
    });
    definitions.get('rootElements').push(blackBoxBPMNProcess);
    
    const externalParticipantElement = moddle.create('bpmn:Participant', {
      id: `ExternalParticipant_${index + 1}`,
      name: externalParticipant,
      processRef: blackBoxBPMNProcess,
    });
    collaboration.get('participants').push(externalParticipantElement);

    const externalParticipantBounds = {
      x: 160,
      y: participantBounds.y - (externalParticipants.length - index) * 200 - 50,
      width: participantBounds.width,
      height: 150,
    };

    const externalParticipantShape = moddle.create('bpmndi:BPMNShape', {
      id: `ExternalParticipant_${index + 1}_di`,
      bpmnElement: externalParticipantElement,
      isHorizontal: true,
      bounds: moddle.create('dc:Bounds', externalParticipantBounds),
    });

    bpmnPlane.planeElement.push(externalParticipantShape);
  });
}
