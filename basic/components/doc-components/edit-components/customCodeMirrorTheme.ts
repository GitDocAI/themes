import { EditorView } from '@codemirror/view'
import { Extension, Prec } from '@codemirror/state'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { javascript } from '@codemirror/lang-javascript'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { json } from '@codemirror/lang-json'
import { python } from '@codemirror/lang-python'
import { sql } from '@codemirror/lang-sql'
import { yaml } from '@codemirror/lang-yaml'
import { markdown } from '@codemirror/lang-markdown'

// Custom syntax highlighting with your theme colors
const customHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#a855f7', fontWeight: '500' }, // purple-500
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: '#ec4899' }, // pink-500
  { tag: [t.function(t.variableName), t.labelName], color: '#3b82f6' }, // blue-600
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#f97316' }, // orange-500
  { tag: [t.definition(t.name), t.separator], color: '#3b82f6' }, // blue-600
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: '#f97316' }, // orange-500
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: '#3b82f6' }, // blue-600
  { tag: [t.meta, t.comment], color: '#9ca3af', fontStyle: 'italic' }, // gray-400
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: '#3b82f6', textDecoration: 'underline' },
  { tag: t.heading, fontWeight: 'bold', color: '#3b82f6' },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: '#f97316' }, // orange-500
  { tag: [t.processingInstruction, t.string, t.inserted], color: '#22c55e' }, // green-500
  { tag: t.invalid, color: '#ef4444' }, // red-500
])

// Language support mapping
export const languageSupport = {
  js: javascript({ jsx: false, typescript: false }),
  jsx: javascript({ jsx: true, typescript: false }),
  ts: javascript({ jsx: false, typescript: true }),
  tsx: javascript({ jsx: true, typescript: true }),
  javascript: javascript({ jsx: false, typescript: false }),
  typescript: javascript({ jsx: false, typescript: true }),
  css: css(),
  html: html(),
  json: json(),
  python: python(),
  bash: javascript(), // Use js for bash highlighting
  sql: sql(),
  yaml: yaml(),
  markdown: markdown(),
}

// Function to get language extensions for a specific language
export const getLanguageExtension = (language: string): Extension[] => {
  const lang = languageSupport[language as keyof typeof languageSupport]
  return lang ? [lang] : []
}

// Custom theme with HIGHEST priority to override basicLight
export const customTheme: Extension = [
  // Use Prec.highest to ensure this theme overrides basicLight which comes after
  Prec.highest(EditorView.theme({
    '&': {
      backgroundColor: 'transparent',
      color: 'inherit',
    },
    '.cm-content': {
      caretColor: 'inherit',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: 'inherit',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
    },
    '.cm-activeLine': {
      backgroundColor: 'transparent',
    },
    '.cm-selectionMatch': {
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    '.cm-matchingBracket, .cm-nonmatchingBracket': {
      backgroundColor: 'transparent',
      outline: '1px solid rgb(59, 130, 246)',
      borderRadius: '2px',
    },
  })),
  // Highest priority for syntax highlighting too
  Prec.highest(syntaxHighlighting(customHighlightStyle)),
]

// All extensions including language support
export const allExtensions: Extension = [
  ...Object.values(languageSupport),
  customTheme,
]
