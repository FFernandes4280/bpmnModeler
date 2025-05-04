import { generateDiagramFromInput } from './chatbot.js';

async function generateDiagramPeriodically() {
  // Get form values
//   const sessionNumber = document.getElementById('session').value;
//   const processName = document.getElementById('processName').value;
//   const participantsInput = document.getElementById('participants').value.split(',');
//   const initialEventName = document.getElementById('initialEventName').value;
//   const initialEventLane = document.getElementById('initialEventLane').value;
//   const elements = JSON.parse(document.getElementById('elements').value);

    const sessionNumber = '12345';
    const processName = 'Montagem do kit';
    const participantsInput = ['Produção', 'Qualidade'];
    const hasExternalParticipants = 'Não';
    const externalParticipantsInput = [];
    const initialEventName = 'Kit Recebido';
    const initialEventLane = 'Produção';
    const elements = [
    { type: 'Atividade', name: 'Separar as Peças', lane: 'Produção' },
    { type: 'Gateway Exclusivo', name: 'A', lane: 'Produção', diverge: '1' },
    { type: 'Atividade', name: 'Montar o Kit', lane: 'Produção' },
    { type: 'Atividade', name: 'Inspecionar', lane: 'Qualidade' },
    { type: 'Gateway Exclusivo', name: 'B', lane: 'Qualidade', diverge: '2' },
    { type: 'Evento Intermediario', name: 'Kit rejeitado', lane: 'Qualidade' },
    { type: 'Gateway Exclusivo', name: 'A', lane: 'Produção' },//Acaba porque volta a um elemento existente
    { type: 'Evento Intermediario', name: 'Kit aprovado', lane: 'Qualidade' },
    { type: 'Atividade', name: 'Embalar', lane: 'Produção' },
    { type: 'Fim', name: 'Produto embalado', lane: 'Produção' }, //Acaba porque é fim
    ];
  // Generate the diagram XML
  const diagramXML = await generateDiagramFromInput(
    processName,
    participantsInput,
    'Não', 
    [],
    initialEventName,
    initialEventLane,
    elements
  );

  // Send the XML to the backend
  fetch('/save-diagram', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionNumber,
      diagramXML,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        console.error('Failed to save diagram:', response.statusText);
      }
    })
    .catch((error) => {
      console.error('Error saving diagram:', error);
    });
}

// Call the function every 2 seconds
setInterval(generateDiagramPeriodically, 2000);