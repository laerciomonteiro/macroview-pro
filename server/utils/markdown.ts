/**
 * Markdown Parser Utility
 * MacroView Pro - Institutional Trading Terminal
 *
 * Uses marked library to convert markdown to HTML
 */

import { marked } from 'marked'

// Configure marked for GitHub Flavored Markdown
marked.setOptions({
  gfm: true,           // GitHub Flavored Markdown
  breaks: true         // Convert \n to <br>
})

/**
 * Parse markdown string to HTML
 * @param markdown - Raw markdown string
 * @returns HTML string
 */
export function parseMarkdown(markdown: string): string {
  if (!markdown) return ''
  
  try {
    return marked.parse(markdown) as string
  } catch (error) {
    console.error('[markdown] Parse error:', error)
    // Return escaped plain text on error
    return escapeHtml(markdown)
  }
}

/**
 * Escape HTML for safe display
 * @param text - Text to escape
 * @returns Escaped HTML string
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}