import React from 'react';
import { useDiagramStore } from '../../store/diagramStore.js';

const ProcessConfig = () => {
  const {
    processName, setProcessName,
    participants, setParticipants,
    hasExternalParticipants, setHasExternalParticipants,
    externalParticipants, setExternalParticipants,
    initialEventName, setInitialEventName,
    initialEventType, setInitialEventType,
    initialEventLane, setInitialEventLane,
    getParticipantsList
  } = useDiagramStore();

  const participantsList = getParticipantsList();

  return (
    <form id="bpmnForm">
      <label htmlFor="processName">Nome do processo:</label>
      <input 
        type="text" 
        id="processName" 
        value={processName}
        onChange={(e) => setProcessName(e.target.value)}
        required 
      />

      <label htmlFor="participants">Participantes (Separados por vírgula):</label>
      <input 
        type="text" 
        id="participants" 
        value={participants}
        onChange={(e) => setParticipants(e.target.value)}
        placeholder="Ex: Participante1, Participante2"
        required 
      />

      <label htmlFor="hasExternalParticipants">Possui participantes externos?</label>
      <select 
        id="hasExternalParticipants" 
        value={hasExternalParticipants}
        onChange={(e) => setHasExternalParticipants(e.target.value)}
      >
        <option value="Não">Não</option>
        <option value="Sim">Sim</option>
      </select>

      {hasExternalParticipants === 'Sim' && (
        <div className="conditional-field">
          <label htmlFor="externalParticipants">Participantes externos (Separados por vírgula):</label>
          <input 
            type="text" 
            id="externalParticipants" 
            value={externalParticipants}
            onChange={(e) => setExternalParticipants(e.target.value)}
            placeholder="Ex: Sistema1, Sistema2"
          />
        </div>
      )}

      <label htmlFor="initialEventName">Nome do evento inicial:</label>
      <input 
        type="text" 
        id="initialEventName" 
        value={initialEventName}
        onChange={(e) => setInitialEventName(e.target.value)}
        placeholder="Ex: Iniciar processo"
        required 
      />

      <label htmlFor="initialEventType">Tipo do evento inicial:</label>
      <select 
        id="initialEventType" 
        value={initialEventType}
        onChange={(e) => setInitialEventType(e.target.value)}
      >
        <option value="Padrão">Início</option>
        <option value="Mensagem">Mensagem</option>
        <option value="Timer">Timer</option>
        <option value="Sinal">Sinal</option>
      </select>

      <label htmlFor="initialEventLane">Participante do evento inicial:</label>
      <select 
        id="initialEventLane" 
        value={initialEventLane}
        onChange={(e) => setInitialEventLane(e.target.value)}
        required
      >
        <option value="">Selecione um participante</option>
        {participantsList.map(participant => (
          <option key={participant} value={participant}>
            {participant}
          </option>
        ))}
      </select>
    </form>
  );
};

export default ProcessConfig;