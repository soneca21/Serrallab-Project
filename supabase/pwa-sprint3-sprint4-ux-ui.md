# PWA Proxima Lista de Implementacoes (S3 + S4)

Data: 2026-02-08
Contexto: continuidade apos S1/S2 concluidos, com foco em usabilidade operacional e design visual.

## Sprint 3 - Usabilidade Operacional

### S3-01 (P0) Fluxo de atualizacao do app (Service Worker update UX)
Objetivo:
- Evitar que usuario fique em versao antiga sem perceber.

Implementacao:
- Exibir banner/toast quando houver nova versao disponivel.
- Acao primaria: "Atualizar agora".
- Acao secundaria: "Depois".

Criterio de aceite:
- Ao publicar nova versao, usuario recebe aviso claro e consegue atualizar sem perder contexto.

### S3-02 (P0) Centro de sincronizacao
Objetivo:
- Consolidar status de fila/sync em um unico ponto de controle.

Implementacao:
- Criar painel/tela com:
  - tamanho da fila,
  - ultimo sync,
  - itens com erro permanente,
  - acoes "Reprocessar tudo" e "Descartar selecionados".

Criterio de aceite:
- Usuario entende facilmente o estado da sincronizacao e consegue resolver pendencias sem suporte tecnico.

### S3-03 (P0) Estados de interface padronizados
Objetivo:
- Reduzir inconsistencias visuais e cognitivas entre telas criticas.

Implementacao:
- Padronizar estados em Leads, Orcamentos e Pipeline:
  - loading,
  - vazio,
  - erro,
  - offline sem cache,
  - sucesso/sincronizado.

Criterio de aceite:
- Todos os estados seguem mesmo padrao de linguagem, hierarquia visual e acoes.

### S3-04 (P1) Mensagens orientadas a acao
Objetivo:
- Trocar mensagens vagas por orientacao de proximo passo.

Implementacao:
- Revisar toasts, banners e erros de rede/fila.
- Incluir CTA contextual: "Tentar novamente", "Ver fila", "Abrir configuracoes", etc.

Criterio de aceite:
- Toda mensagem de erro relevante informa claramente o que o usuario pode fazer em seguida.

### S3-05 (P1) Acessibilidade base nos fluxos PWA
Objetivo:
- Melhorar usabilidade real para todos os perfis de usuario.

Implementacao:
- Garantir foco visivel e ordem de tab coerente.
- Revisar contraste (AA), labels e semantica em componentes principais.
- Validar componentes de status/alerta com leitores de tela.

Criterio de aceite:
- Fluxos principais navegaveis por teclado e sem bloqueios obvios de acessibilidade.

### S3-06 (P1) QA de usabilidade em device real
Objetivo:
- Fechar pendencias operacionais em ambiente real de uso.

Implementacao:
- Rodar checklist manual em:
  - Android Chrome (PWA instalado),
  - iOS Safari,
  - Desktop Chrome.
- Consolidar evidencias em relatorio dedicado.

Criterio de aceite:
- Checklist aprovado com evidencias e sem bloqueios P0/P1 abertos.

## Sprint 4 - Design Visual e Consistencia

### S4-01 (P1) Sistema visual PWA (tokens)
Objetivo:
- Criar base visual unica para evolucao sem retrabalho.

Implementacao:
- Definir tokens de:
  - cor semantica (`success`, `warning`, `error`, `offline`, `syncing`),
  - espacamento,
  - raio,
  - sombra,
  - borda.

Criterio de aceite:
- Componentes criticos consumindo tokens centralizados e sem valores dispersos.

### S4-02 (P1) Tipografia e hierarquia de leitura
Objetivo:
- Melhorar legibilidade e escaneabilidade no mobile e desktop.

Implementacao:
- Definir escala tipografica para titulos, subtitulos, corpo e metadados.
- Ajustar densidade visual de cards/listas para leitura rapida em campo.

Criterio de aceite:
- Conteudo principal fica mais legivel e com hierarquia visual consistente em todas as telas foco.

### S4-03 (P1) Componentes visuais de status unificados
Objetivo:
- Tornar feedback de sistema imediatamente reconhecivel.

Implementacao:
- Unificar visual/semantica de badges, chips, alertas e indicadores de sync/offline/erro.

Criterio de aceite:
- Mesmo estado sempre tem mesma cor, icone e linguagem em todo app.

### S4-04 (P1) Refino da navegacao mobile
Objetivo:
- Reduzir friccao nas tarefas mais frequentes.

Implementacao:
- Revisar atalhos e CTA das telas principais.
- Garantir acesso rapido a:
  - sincronizacao,
  - pendencias offline,
  - acoes criticas de cada tela.

Criterio de aceite:
- Menos toques para concluir tarefas comuns e menor taxa de abandono de fluxo.

### S4-05 (P2) Motion funcional
Objetivo:
- Usar animacao para comunicar estado, nao apenas decorar.

Implementacao:
- Microinteracoes curtas para:
  - inicio/fim de sync,
  - sucesso/erro de fila,
  - transicao de estados vazios/erro.
- Respeitar performance e reduced motion.

Criterio de aceite:
- Motion melhora percepcao de estado sem degradar desempenho.

### S4-06 (P2) Guia visual final
Objetivo:
- Documentar padroes para manter consistencia nas proximas entregas.

Implementacao:
- Gerar `supabase/pwa-ux-ui-guidelines.md` com:
  - tokens,
  - componentes,
  - padroes de mensagem,
  - exemplos de uso.

Criterio de aceite:
- Guia publicado e usado como referencia para novas features.

## Ordem de Execucao Recomendada

1. S3-01
2. S3-02
3. S3-03
4. S3-05
5. S4-01
6. S4-03
7. S4-04
8. S4-02
9. S4-05
10. S4-06
11. S3-04
12. S3-06

## Definicao de Pronto (S3 + S4)

- Usuario entende e controla sincronizacao sem suporte tecnico.
- Estados de erro/offline/sucesso sao consistentes em telas criticas.
- Fluxo mobile principal reduz atrito operacional.
- Sistema visual e guia de padroes estabelecidos para evolucao continua.
- Validacao real-device concluida sem bloqueios P0/P1.
