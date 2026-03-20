import { describe, it, expect } from 'vitest';

function matchRule(rules, messageText) {
  if (!messageText) return null;
  const msgLower = messageText.toLowerCase().trim();

  // Highest priority (largest number) comes first
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    if (!rule.is_active) continue;

    if (rule.trigger_type === 'exact') {
      if (rule.keyword.toLowerCase() === msgLower) return rule;
    } else if (rule.trigger_type === 'contains') {
      if (msgLower.includes(rule.keyword.toLowerCase())) return rule;
    } else if (rule.trigger_type === 'button_reply') {
      if (rule.keyword === messageText) return rule;
    }
  }
  return null;
}

const mockRules = [
  { id: 1, trigger_type: 'contains', keyword: 'hola', priority: 10, is_active: true },
  { id: 2, trigger_type: 'exact', keyword: 'ayuda', priority: 20, is_active: true },
  { id: 3, trigger_type: 'button_reply', keyword: 'BTN_AGENDAR', priority: 100, is_active: true },
  { id: 4, trigger_type: 'contains', keyword: 'hola', priority: 5, is_active: true }, // lower priority
  { id: 5, trigger_type: 'contains', keyword: 'hola', priority: 30, is_active: false } // inactive
];

describe('automation_rules matchRule', () => {
  it('retorna la regla de mayor prioridad cuando hay match', () => {
    const rule = matchRule(mockRules, 'hola que tal');
    expect(rule.id).toBe(1); // Since id:5 is inactive, id:1 (priority 10) should match before id:4 (priority 5)
  });

  it('retorna null cuando no hay match', () => {
    const rule = matchRule(mockRules, 'adios');
    expect(rule).toBeNull();
  });

  it('keyword match es case-insensitive', () => {
    const rule = matchRule(mockRules, 'HOLA COMO ESTAS');
    expect(rule.id).toBe(1);

    const ruleExact = matchRule(mockRules, 'AYUDA');
    expect(ruleExact.id).toBe(2);
  });

  it('button_reply match exacto por ID', () => {
    const rule = matchRule(mockRules, 'BTN_AGENDAR');
    expect(rule.id).toBe(3);
  });
});
