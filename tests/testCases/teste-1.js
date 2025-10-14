// Test case: teste-1
// Description: [Add description of what this test validates]

export const testCase = {
    // Process configuration
    processName: "Concessão de crédito",

    // Participants (lanes)
    participants: [
        "Gerente de conta",
        "Gerente de produto"
    ],

    // External participants configuration
    hasExternalParticipants: "Não", // "Sim" or "Não"
    externalParticipants: [], // Only used if hasExternalParticipants is "Sim"

    // Process elements - modify this array with your test data
    elements: [
        {
            "type": "Inicio",
            "name": "Padrão_Crédito solicitado",
            "lane": "Gerente de conta"
        },
        {
            "type": "Atividade",
            "name": "Default_Avaliar solicitação de crédito",
            "lane": "Gerente de conta"
        },
        {
            "type": "Atividade",
            "name": "Default_Preparar documentação",
            "lane": "Gerente de conta"
        },
        {
            "type": "Atividade",
            "name": "Default_Avaliar cŕedito",
            "lane": "Gerente de produto"
        },
        {
            "type": "Evento Intermediario",
            "name": "Padrão_Crédito avaliado",
            "lane": "Gerente de produto"
        },
        {
            "type": "Atividade",
            "name": "Default_Liberar crédito",
            "lane": "Gerente de conta"
        },
        {
            "type": "Fim",
            "name": "Padrão_Crédito liberado",
            "lane": "Gerente de conta"
        }
    ]

};
