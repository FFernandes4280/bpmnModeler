import BpmnModdle from 'bpmn-moddle';

// Create an instance of BpmnModdle
const moddle = new BpmnModdle();

const xmlStr =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" ' +
                     'id="empty-definitions" ' +
                     'targetNamespace="http://bpmn.io/schema/bpmn">' +
  '</bpmn2:definitions>';

async function generateDiagram() {
  const { rootElement: definitions } = await moddle.fromXML(xmlStr);

  // Update id attribute
  definitions.set('id', 'NEW ID');

  // Add a root element
  const bpmnProcess = moddle.create('bpmn:Process', { id: 'MyProcess_1' });
  definitions.get('rootElements').push(bpmnProcess);

  // Convert the updated definitions back to XML
  const { xml: xmlStrUpdated } = await moddle.toXML(definitions);

  return xmlStrUpdated;
}

// Generate the BPMN diagram and export it
export const diagram = await generateDiagram();