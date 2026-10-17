/**
 * Utility to detect variables in prompt text.
 * Matches:
 *  - {{variable_name}}
 *  - {variable_name}
 *  - [VARIABLE_NAME] (uppercase with optional underscore/dash)
 */
export function extractVariables(content: string): string[] {
  if (!content) return [];
  
  const variables = new Set<string>();

  // Pattern 1: {{var}}
  const doubleBraces = content.match(/\{\{([a-zA-Z0-9_\-\s]+)\}\}/g);
  if (doubleBraces) {
    doubleBraces.forEach((match) => {
      const clean = match.replace(/\{\{|\}\}/g, '').trim();
      if (clean && clean.length <= 40) variables.add(clean);
    });
  }

  // Pattern 2: {var} (single curly braces not part of double braces)
  const singleBraces = content.match(/(?<!\{)\{([a-zA-Z0-9_\-]+)\}(?!\})/g);
  if (singleBraces) {
    singleBraces.forEach((match) => {
      const clean = match.replace(/\{|\}/g, '').trim();
      if (clean && clean.length <= 40) variables.add(clean);
    });
  }

  // Pattern 3: [VARIABLE] uppercase placeholder tags
  const squareBrackets = content.match(/\[([A-Z0-9_\-\s]{2,40})\]/g);
  if (squareBrackets) {
    squareBrackets.forEach((match) => {
      const clean = match.replace(/\[|\]/g, '').trim();
      if (clean) variables.add(clean);
    });
  }

  return Array.from(variables);
}

/**
 * Replace variables in text with provided dictionary
 */
export function replaceVariables(
  template: string,
  values: Record<string, string>
): string {
  let result = template;

  Object.entries(values).forEach(([key, val]) => {
    if (val === undefined || val === null) return;
    
    // Replace {{key}}
    const doubleRegex = new RegExp(`\\{\\{\\s*${escapeRegExp(key)}\\s*\\}\\}`, 'g');
    result = result.replace(doubleRegex, val);

    // Replace {key}
    const singleRegex = new RegExp(`(?<!\\{)\\{${escapeRegExp(key)}\\}(?!\\})`, 'g');
    result = result.replace(singleRegex, val);

    // Replace [key]
    const bracketRegex = new RegExp(`\\[${escapeRegExp(key)}\\]`, 'g');
    result = result.replace(bracketRegex, val);
  });

  return result;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Estimate word count and approximate token count
 */
export function getPromptStats(text: string) {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    return { words: 0, characters: 0, estimatedTokens: 0 };
  }
  const characters = trimmed.length;
  const words = trimmed.split(/\s+/).filter(Boolean).length;
  // Approximation for mixed Indonesian & English: ~4 characters per token
  const estimatedTokens = Math.ceil(characters / 3.8);

  return { words, characters, estimatedTokens };
}
