// Arquivo de teste para desenvolvimento
// Para usar: no diagramStore.js, defina USE_TEST_DATA = true

export const testElements =[
  {
    "type": "Inicio",
    "name": "Mensagem_Pedido do formato",
    "lane": "Setor de montagem"
  },
  {
    "type": "Mensagem",
    "name": "Recebimento_Mensagem_1",
    "lane": "Planejamento de produção"
  },
  {
    "type": "Atividade",
    "name": "Default_Montar a peça",
    "lane": "Setor de montagem"
  },
  {
    "type": "Gateway Exclusivo",
    "lane": "Setor de montagem",
    "name": "followingExclusivo_Montar_a_pea",
    "diverge": [
      4
    ]
  },
  {
    "type": "Atividade",
    "name": "Default_Testar a peça",
    "lane": "Setor de montagem"
  },
  {
    "type": "Gateway Exclusivo",
    "lane": "Setor de montagem",
    "name": "followingExclusivo_Testar_a_pea",
    "diverge": [
      6,
      9
    ]
  },
  {
    "type": "Evento Intermediario",
    "name": "Padrão_Peça foi rejeitada",
    "lane": "Setor de montagem"
  },
  {
    "type": "Atividade",
    "name": "Default_Retrabalhar a peça",
    "lane": "Setor de montagem"
  },
  {
    "type": "Gateway Existente",
    "name": "followingExclusivo_Montar_a_pea",
    "lane": "Setor de montagem",
    "originalType": "Gateway Exclusivo"
  },
  {
    "type": "Evento Intermediario",
    "name": "Padrão_Peça foi aprovada",
    "lane": "Setor de montagem"
  },
  {
    "type": "Atividade",
    "name": "Default_Pintar a peça",
    "lane": "Setor de montagem"
  },
  {
    "type": "Gateway Paralelo",
    "lane": "Setor de montagem",
    "name": "followingParalelo_Pintar_a_pea",
    "diverge": [
      12,
      21
    ]
  },
  {
    "type": "Gateway Exclusivo",
    "lane": "Setor de montagem",
    "name": "followingExclusivo_Gateway_11",
    "diverge": [
      13
    ]
  },
  {
    "type": "Atividade",
    "name": "Default_Etiquetar a peça",
    "lane": "Setor de montagem"
  },
  {
    "type": "Atividade",
    "name": "Default_Checar a fixação da etiqueta",
    "lane": "Setor de montagem"
  },
  {
    "type": "Gateway Exclusivo",
    "lane": "Setor de montagem",
    "name": "followingExclusivo_Checar_a_fixao_da_etiqueta",
    "diverge": [
      16,
      19
    ]
  },
  {
    "type": "Evento Intermediario",
    "name": "Padrão_Etiqueta foi mal fixada",
    "lane": "Setor de montagem"
  },
  {
    "type": "Atividade",
    "name": "Default_Retirar a etiqueta",
    "lane": "Setor de montagem"
  },
  {
    "type": "Gateway Existente",
    "name": "followingExclusivo_Gateway_11",
    "lane": "Setor de montagem",
    "originalType": "Gateway Exclusivo"
  },
  {
    "type": "Evento Intermediario",
    "name": "Padrão_Etiqueta foi bem fixada",
    "lane": "Setor de montagem"
  },
  {
    "type": "Gateway Existente",
    "name": "followingParalelo_Registrar_a_pea_no_sistema",
    "lane": "Setor de montagem",
    "originalType": "Gateway Paralelo"
  },
  {
    "type": "Atividade",
    "name": "Default_Registrar a peça no sistema",
    "lane": "Setor de montagem"
  },
  {
    "type": "Gateway Paralelo",
    "lane": "Setor de montagem",
    "name": "followingParalelo_Registrar_a_pea_no_sistema",
    "diverge": [
      23
    ]
  },
  {
    "type": "Atividade",
    "name": "Default_Embalar a peça",
    "lane": "Setor de embalagem"
  },
  {
    "type": "Fim",
    "name": "Padrão_Peça embalada",
    "lane": "Setor de embalagem"
  }
];
