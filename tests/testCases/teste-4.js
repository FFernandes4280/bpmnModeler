// Test case: teste-4
// Description: [Add description of what this test validates]

export const testCase = {
    // Process configuration
    processName: "Aprovação de artigos",

    // Participants (lanes)
    participants: [
        "Comissão julgadora"
    ],

    // External participants configuration
    hasExternalParticipants: "Não", // "Sim" or "Não"
    externalParticipants: [], // Only used if hasExternalParticipants is "Sim"

    // Process elements - modify this array with your test data
    elements: [
        {
            "type": "Inicio",
            "name": "Padrão_Artgo recebido",
            "lane": "Comissão julgadora"
        },
        {
            "type": "Gateway Exclusivo",
            "lane": "Comissão julgadora",
            "name": "followingExclusivo_",
            "diverge": [
                2
            ]
        },
        {
            "type": "Atividade",
            "name": "Default_Checar formatação",
            "lane": "Comissão julgadora"
        },
        {
            "type": "Data Object",
            "name": "Envio_Norma de formatação"
        },
        {
            "type": "Gateway Exclusivo",
            "lane": "Comissão julgadora",
            "name": "followingExclusivo_Norma_de_formatao",
            "diverge": [
                5,
                7,
                14
            ]
        },
        {
            "type": "Evento Intermediario",
            "name": "Padrão_Artigo com formatação aprovada",
            "lane": "Comissão julgadora"
        },
        {
            "type": "Gateway Existente",
            "lane": "Comissão julgadora",
            "name": "followingExclusivo_Corrigir_falhas",
            "originalType": "Gateway Exclusivo"
        },
        {
            "type": "Evento Intermediario",
            "name": "Padrão_Identidicadas pequenas falhas de formatação",
            "lane": "Comissão julgadora"
        },
        {
            "type": "Atividade",
            "name": "Default_Corrigir falhas",
            "lane": "Comissão julgadora"
        },
        {
            "type": "Gateway Exclusivo",
            "lane": "Comissão julgadora",
            "name": "followingExclusivo_Corrigir_falhas",
            "diverge": [
                10
            ]
        },
        {
            "type": "Atividade",
            "name": "Default_Avaliar o artigo",
            "lane": "Comissão julgadora"
        },
        {
            "type": "Gateway Exclusivo",
            "lane": "Comissão julgadora",
            "name": "followingExclusivo_Avaliar_o_artigo",
            "diverge": [
                12,
                13
            ]
        },
        {
            "type": "Fim",
            "name": "Padrão_Artigo indicado para apresentação oral",
            "lane": "Comissão julgadora"
        },
        {
            "type": "Fim",
            "name": "Padrão_Artigo indicado para apresentação em poster",
            "lane": "Comissão julgadora"
        },
        {
            "type": "Evento Intermediario",
            "name": "Padrão_Artigo com formatação reprovada",
            "lane": "Comissão julgadora"
        },
        {
            "type": "Atividade",
            "name": "Default_Solicitar adequação à formatação exigida",
            "lane": "Comissão julgadora"
        },
        {
            "type": "Evento Intermediario",
            "name": "Padrão_Artigo reformatado recebido",
            "lane": "Comissão julgadora"
        },
        {
            "type": "Gateway Existente",
            "lane": "Comissão julgadora",
            "name": "followingExclusivo_",
            "originalType": "Gateway Exclusivo"
        }
    ]
};
