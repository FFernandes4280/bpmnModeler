// Test case: teste-3
// Description: [Add description of what this test validates]

export const testCase = {
    // Process configuration
    processName: "Montagem do kit",

    // Participants (lanes)
    participants: [
        "Produção",
        "Qualidade"
    ],

    // External participants configuration
    hasExternalParticipants: "Não", // "Sim" or "Não"
    externalParticipants: [], // Only used if hasExternalParticipants is "Sim"

    // Process elements - modify this array with your test data
    elements: [
        {
            "type": "Inicio",
            "name": "Padrão_Kit recebido",
            "lane": "Produção"
        },
        {
            "type": "Atividade",
            "name": "Default_Separar as peças",
            "lane": "Produção"
        },
        {
            "type": "Gateway Exclusivo",
            "lane": "Produção",
            "name": "followingExclusivo_Separar_as_peas",
            "diverge": [
                3
            ]
        },
        {
            "type": "Atividade",
            "name": "Default_Montar",
            "lane": "Produção"
        },
        {
            "type": "Atividade",
            "name": "Default_Inspecionar",
            "lane": "Produção"
        },
        {
            "type": "Gateway Exclusivo",
            "lane": "Produção",
            "name": "followingExclusivo_Inspecionar",
            "diverge": [
                6,
                9
            ]
        },
        {
            "type": "Evento Intermediario",
            "name": "Padrão_Kit foi aprovado",
            "lane": "Produção"
        },
        {
            "type": "Atividade",
            "name": "Default_Embalar",
            "lane": "Produção"
        },
        {
            "type": "Fim",
            "name": "Padrão_Produto embalado",
            "lane": "Produção"
        },
        {
            "type": "Evento Intermediario",
            "name": "Padrão_Kit foi rejeitado",
            "lane": "Produção"
        },
        {
            "type": "Gateway Existente",
            "lane": "Produção",
            "name": "followingExclusivo_Separar_as_peas",
            "originalType": "Gateway Exclusivo"
        }
    ]
};
