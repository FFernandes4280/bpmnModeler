// Test case: teste-2
// Description: [Add description of what this test validates]

export const testCase = {
    // Process configuration
    processName: "Execução de projetos",

    // Participants (lanes)
    participants: [
        "Execução de projetos"
    ],

    // External participants configuration
    hasExternalParticipants: "Sim", // "Sim" or "Não"
    externalParticipants: [
        "Solicitante",
        "Direção"
    ],

    // Process elements - modify this array with your test data
    elements: [
        {
            "type": "Inicio",
            "name": "Mensagem_Demanda",
            "lane": "Execução de projetos"
        },
        {
            "type": "Mensagem",
            "name": "Recebimento_Mensagem_1",
            "lane": "Solicitante"
        },
        {
            "type": "Gateway Exclusivo",
            "lane": "Execução de projetos",
            "name": "followingExclusivo_Mensagem_1",
            "diverge": [
                3
            ]
        },
        {
            "type": "Atividade",
            "name": "Default_Definir escopo",
            "lane": "Execução de projetos"
        },
        {
            "type": "Atividade",
            "name": "Out_Solicitar a avaliação de escopo",
            "lane": "Execução de projetos"
        },
        {
            "type": "Mensagem",
            "name": "Envio_Mensagem_5",
            "lane": "Solicitante"
        },
        {
            "type": "Evento Intermediario",
            "name": "Mensagem_Escopo avaliado",
            "lane": "Execução de projetos"
        },
        {
            "type": "Mensagem",
            "name": "Recebimento_Mensagem_7",
            "lane": "Solicitante"
        },
        {
            "type": "Atividade",
            "name": "Default_Analisar o escopo",
            "lane": "Execução de projetos"
        },
        {
            "type": "Gateway Exclusivo",
            "lane": "Execução de projetos",
            "name": "followingExclusivo_Analisar_o_escopo",
            "diverge": [
                10,
                17
            ]
        },
        {
            "type": "Evento Intermediario",
            "name": "Padrão_Escopo aprovado",
            "lane": "Execução de projetos"
        },
        {
            "type": "Atividade",
            "name": "Default_Solicitar avalisação financeira",
            "lane": "Execução de projetos"
        },
        {
            "type": "Mensagem",
            "name": "Envio_Mensagem_12",
            "lane": "Direção"
        },
        {
            "type": "Evento Intermediario",
            "name": "Mensagem_Financeiro avaliado",
            "lane": "Execução de projetos"
        },
        {
            "type": "Mensagem",
            "name": "Recebimento_Mensagem_14",
            "lane": "Direção"
        },
        {
            "type": "Fim",
            "name": "Mensagem_Solicitante avisado",
            "lane": "Execução de projetos"
        },
        {
            "type": "Mensagem",
            "name": "Envio_Mensagem_16",
            "lane": "Solicitante"
        },
        {
            "type": "Evento Intermediario",
            "name": "Padrão_Escopo rejeitado",
            "lane": "Execução de projetos"
        },
        {
            "type": "Gateway Existente",
            "lane": "Execução de projetos",
            "name": "followingExclusivo_Mensagem_1",
            "originalType": "Gateway Exclusivo"
        }
    ]
};
