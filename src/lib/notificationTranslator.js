const TITLE_TRANSLATIONS = {
  Error: 'Erro',
  Success: 'Sucesso',
  Warning: 'Aviso',
  Info: 'Informativo',
};

const patternRules = [
  {
    pattern: /Could not find the '([^']+)' column of '([^']+)' in the schema cache/i,
    translate: (match) =>
      `Não foi possível encontrar a coluna '${match[1]}' da tabela '${match[2]}' no cache do esquema.`,
  },
  {
    pattern: /permission denied/i,
    translate: () => 'Permissão negada para executar essa ação.',
  },
  {
    pattern: /failed to fetch/i,
    translate: () => 'Falha ao se comunicar com o servidor. Verifique sua conexão.',
  },
  {
    pattern: /network request failed/i,
    translate: () => 'Falha na requisição de rede. Tente novamente.',
  },
];

const replacements = [
  ['Could not', 'Não foi possível'],
  ['cannot', 'não pode'],
  ['Unable to', 'Não foi possível'],
  ['Failed to', 'Falha ao'],
  ['error', 'erro'],
];

const translateNotificationTitle = (title) => {
  if (!title) return title;
  return TITLE_TRANSLATIONS[title] || title;
};

const translateNotificationMessage = (message) => {
  if (!message || typeof message !== 'string') return message;

  for (const rule of patternRules) {
    const match = message.match(rule.pattern);
    if (match) {
      return rule.translate(match);
    }
  }

  let translation = message;
  replacements.forEach(([search, replace]) => {
    translation = translation.replace(new RegExp(search, 'gi'), replace);
  });

  return translation;
};

export { translateNotificationTitle, translateNotificationMessage };
