import { create } from 'zustand';
import { generateDiagramFromInput } from '../../diagramCreator.js';

export const useDiagramStore = create((set, get) => ({
  // Configuração do Processo
  processName: '',
  participants: '',
  hasExternalParticipants: 'Não',
  externalParticipants: '',
  
  // Evento Inicial
  initialEventName: '',
  initialEventType: 'Padrão',
  initialEventLane: '',
  
  // Elementos
  elements: [],
  
  // Estado do Diagrama
  viewer: null,
  
  // Actions para configuração do processo
  setProcessName: (name) => set({ processName: name }),
  setParticipants: (participants) => set({ participants }),
  setHasExternalParticipants: (hasExternal) => set({ hasExternalParticipants: hasExternal }),
  setExternalParticipants: (external) => set({ externalParticipants: external }),
  
  // Actions para evento inicial
  setInitialEventName: (name) => set({ initialEventName: name }),
  setInitialEventType: (type) => set({ initialEventType: type }),
  setInitialEventLane: (lane) => set({ initialEventLane: lane }),
  
  // Actions para o viewer
  setViewer: (viewer) => set({ viewer }),
  
  // Actions para elementos
  addElement: (element) => set((state) => ({
    elements: [...state.elements, { ...element, id: Date.now() + Math.random() }]
  })),
  
  updateElement: (id, updates) => set((state) => ({
    elements: state.elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    )
  })),
  
  removeElement: (id) => set((state) => ({
    elements: state.elements.filter(el => el.id !== id)
  })),
  
  moveElement: (id, direction) => set((state) => {
    const elements = [...state.elements];
    const index = elements.findIndex(el => el.id === id);
    if (index === -1) return state;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= elements.length) return state;
    
    [elements[index], elements[newIndex]] = [elements[newIndex], elements[index]];
    return { elements };
  }),
  
  // Helpers para obter dados processados
  getParticipantsList: () => {
    const { participants } = get();
    return participants.split(',').map(p => p.trim()).filter(p => p);
  },
  
  getExternalParticipantsList: () => {
    const { hasExternalParticipants, externalParticipants } = get();
    return hasExternalParticipants === 'Sim' 
      ? externalParticipants.split(',').map(p => p.trim()).filter(p => p)
      : [];
  },
  
  getAllParticipants: () => {
    const { getParticipantsList, getExternalParticipantsList } = get();
    return [...getParticipantsList(), ...getExternalParticipantsList()];
  },
  
  // Obter gateways existentes com seus índices
  getExistingGateways: () => {
    const { elements } = get();
    return elements
      .map((el, index) => ({ ...el, index: index + 1 }))
      .filter(el => el.type === 'Gateway');
  },
  
  // Obter elemento por índice
  getElementByIndex: (index) => {
    const { elements } = get();
    return elements[index - 1] || null;
  },
  
  // Função para atualizar diagrama
  updateDiagram: async (processState) => {
    const { viewer } = get();
    
    if (!processState || !viewer) {
      console.log('⚠️ Missing processState or viewer, skipping diagram update');
      return;
    }
    
    try {
      console.log('� Starting diagram update...');
      
      // Converte elementos React para formato do diagramCreator
      const processedElements = processState.elements.map((element, index) => {
        const processed = {
          type: element.type,
          label: element.label || '',
          participant: element.participant || ''
        };
        
        // Adiciona propriedades específicas baseadas no tipo
        switch (element.type) {
          case 'Atividade':
            processed.name = `${element.subtype || 'Default'}_${element.label || `Atividade_${index + 1}`}`;
            processed.lane = element.participant;
            break;
            
          case 'Evento Intermediario':
            processed.name = `${element.subtype || 'Padrão'}_${element.label || `Evento_${index + 1}`}`;
            processed.lane = element.participant;
            break;
            
          case 'Fim':
            processed.name = `${element.subtype || 'Padrão'}_${element.label || `Fim_${index + 1}`}`;
            processed.lane = element.participant;
            break;
            
          case 'Gateway Exclusivo':
            processed.name = element.label || `Gateway_Exclusivo_${index + 1}`;
            processed.lane = element.participant;
            break;
            
          case 'Gateway Paralelo':
            processed.name = element.label || `Gateway_Paralelo_${index + 1}`;
            processed.lane = element.participant;
            break;
            
          case 'Gateway Existente':
            processed.refGateway = element.refGateway;
            // Nome será resolvido pelo diagramCreator baseado na referência
            break;
            
          case 'Mensagem':
            processed.name = `${element.subtype || 'Envio'}_Mensagem_${index + 1}`;
            processed.direction = element.subtype || 'Envio';
            break;
            
          case 'Data Object':
            processed.name = `${element.subtype || 'Envio'}_${element.label || `Data_${index + 1}`}`;
            processed.direction = element.subtype || 'Envio';
            break;
            
          default:
            processed.name = element.label || `${element.type}_${index + 1}`;
        }
        
        return processed;
      });
      
      // Adiciona elemento inicial
      const initialElement = {
        type: 'Inicio',
        name: `${processState.initialEventType || 'Padrão'}_${processState.initialEventName}`,
        lane: processState.initialEventLane
      };
      
      const allElements = [initialElement, ...processedElements];
      
      // Processa participantes
      const participantsList = processState.participants
        .split(',')
        .map(p => p.trim())
        .filter(p => p);
        
      const externalParticipantsList = processState.hasExternalParticipants === 'Sim'
        ? processState.externalParticipants.split(',').map(p => p.trim()).filter(p => p)
        : [];
      
      console.log('🔍 Elements:', allElements);
      // Chama o diagramCreator
      const diagramXML = await generateDiagramFromInput(
        processState.processName,
        participantsList,
        processState.hasExternalParticipants,
        externalParticipantsList,
        allElements
      );
      
      // Atualiza o viewer com o novo diagrama
      await viewer.importXML(diagramXML);
      
      // Auto-ajusta o zoom para mostrar todo o diagrama
      setTimeout(() => {
        const canvas = viewer.get('canvas');
        canvas.zoom('fit-viewport', 'auto');
      }, 100);
      
      console.log('✅ Diagram updated successfully!');
      
    } catch (error) {
      console.error('❌ Error updating diagram:', error);
    }
  }
}));