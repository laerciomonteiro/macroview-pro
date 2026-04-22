/**
 * News Analysis Sync Composable
 * Shared state to synchronize news refresh with AI analysis regeneration
 * 
 * Features:
 * - Only triggers AI refresh if news actually changed
 * - Uses hash of article IDs for robust change detection
 * 
 * Usage:
 * - NewsRefreshButton calls onNewsRefreshed(articles) after fetching news
 * - Returns boolean indicating if news changed (for user feedback)
 * - dashboard.vue watches shouldRefreshAnalysis to regenerate AI analysis
 */

import { ref, readonly } from 'vue'

const shouldRefreshAnalysis = ref(false)
const lastArticlesHash = ref<string>('')

/**
 * Generate hash from article IDs for robust change detection
 */
const generateHash = (articles: any[]): string => {
  if (!articles || articles.length === 0) return ''
  const sortedIds = articles
    .map((a: any) => a.id || a.url)
    .filter(Boolean)
    .sort()
  return sortedIds.join(',')
}

export const useNewsAnalysisSync = () => {
  /**
   * Trigger AI analysis refresh
   */
  const triggerAnalysisRefresh = () => {
    shouldRefreshAnalysis.value = true
    // Reset after a short delay to allow watcher to detect the change
    setTimeout(() => {
      shouldRefreshAnalysis.value = false
    }, 100)
  }

  /**
   * Check if news changed and trigger analysis if needed
   * Uses hash of article IDs for robust change detection
   * 
   * @returns boolean indicating if news changed (for user feedback)
   */
  const onNewsRefreshed = (articles: any[]): boolean => {
    if (!articles || articles.length === 0) return false

    const currentHash = generateHash(articles)
    const hasChanged = currentHash !== lastArticlesHash.value

    if (hasChanged) {
      triggerAnalysisRefresh()
      lastArticlesHash.value = currentHash
    }

    return hasChanged
  }

  return {
    shouldRefreshAnalysis: readonly(shouldRefreshAnalysis),
    triggerAnalysisRefresh,
    onNewsRefreshed,
    lastArticlesHash: readonly(lastArticlesHash)
  }
}