// Test case: teste-5
// Description: [Add description of what this test validates]

export const testCase = {
    // Process configuration
    processName: "Order to cash",

    // Participants (lanes)
    participants: [
        "Estoque final",
        "Expedição"
    ],

    // External participants configuration
    hasExternalParticipants: "Não", // "Sim" or "Não"
    externalParticipants: [], // Only used if hasExternalParticipants is "Sim"

    // Process elements - modify this array with your test data
    elements: [
        {
            "type": "Inicio",
            "name": "Padrão_Ordem recebida",
            "lane": "Estoque final"
        },
        {
            "type": "Atividade",
            "name": "Default_Checar disponibilidade no estoque",
            "lane": "Estoque final"
        },
        {
            "type": "Gateway Exclusivo",
            "lane": "Estoque final",
            "name": "followingExclusivo_Checar_disponibilidade_no_estoque",
            "diverge": [
                3,
                6
            ]
        },
        {
            "type": "Evento Intermediario",
            "name": "Padrão_Produto não disponibilizado",
            "lane": "Estoque final"
        },
        {
            "type": "Atividade",
            "name": "Default_Rejeitar a ordem",
            "lane": "Estoque final"
        },
        {
            "type": "Fim",
            "name": "Padrão_Ordem rejeitada",
            "lane": "Estoque final"
        },
        {
            "type": "Evento Intermediario",
            "name": "Padrão_Produto disponibilizado",
            "lane": "Estoque final"
        },
        {
            "type": "Atividade",
            "name": "Default_Pegar produto no estoque",
            "lane": "Estoque final"
        },
        {
            "type": "Atividade",
            "name": "Default_Confirmar a ordem",
            "lane": "Estoque final"
        },
        {
            "type": "Gateway Paralelo",
            "lane": "Estoque final",
            "name": "followingParalelo_Confirmar_a_ordem",
            "diverge": [
                10,
                15
            ]
        },
        {
            "type": "Atividade",
            "name": "Default_Emitir fatura ",
            "lane": "Estoque final"
        },
        {
            "type": "Atividade",
            "name": "Default_Receber pagamento",
            "lane": "Estoque final"
        },
        {
            "type": "Gateway Paralelo",
            "lane": "Estoque final",
            "name": "followingParalelo_Receber_pagamento",
            "diverge": [
                13
            ]
        },
        {
            "type": "Atividade",
            "name": "Default_Arquivar a ordem",
            "lane": "Estoque final"
        },
        {
            "type": "Fim",
            "name": "Padrão_Ordem completada",
            "lane": "Estoque final"
        },
        {
            "type": "Atividade",
            "name": "Default_Obter o endereço para envio",
            "lane": "Expedição"
        },
        {
            "type": "Atividade",
            "name": "Default_Enviar o produto",
            "lane": "Expedição"
        },
        {
            "type": "Gateway Existente",
            "lane": "Estoque final",
            "name": "followingParalelo_Receber_pagamento",
            "originalType": "Gateway Paralelo"
        }
    ]
};