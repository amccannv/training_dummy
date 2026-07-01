import type { Keybind } from '../types';

const CODE_TO_DISPLAY: Record<string, string> = {
  Backquote: '`',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
  Space: 'Space',
};

function codeToDisplay(code: string): string {
  if (CODE_TO_DISPLAY[code]) return CODE_TO_DISPLAY[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('F') && code.length >= 2 && code.length <= 3) return code;
  if (code.startsWith('Arrow')) return code.slice(5);
  return code;
}

export function formatKeybind(keybind: Keybind): string {
  const parts: string[] = [];

  if (keybind.ctrl) parts.push('Ctrl');
  if (keybind.shift) parts.push('Shift');
  if (keybind.alt) parts.push('Alt');
  if (keybind.meta) parts.push('Cmd');

  parts.push(codeToDisplay(keybind.code));

  return parts.join('+');
}

export function keybindEquals(a: Keybind, b: Keybind): boolean {
  return (
    a.code === b.code &&
    a.ctrl === b.ctrl &&
    a.shift === b.shift &&
    a.alt === b.alt &&
    a.meta === b.meta
  );
}
