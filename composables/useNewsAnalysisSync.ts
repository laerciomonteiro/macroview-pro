/**
 * News Analysis Sync Composable
 * Shared state to synchronize news refresh with AI analysis regeneration
 * 
 * Features:
 * - Only triggers AI refresh if news actually changed
 * - Compares article count and latest timestamp to detect changes
 * 
 * Usage:
 * - NewsRefreshButton calls onNewsRefreshed(articles) after fetching news
 * - dashboard.vue watches shouldRefreshAnalysis to regenerate AI analysis
 */

import { ref, readonly } from 'vue'

const shouldRefreshAnalysis = ref(false)
const lastArticleCount = ref(0)
const lastLatestTimestamp = ref<number>(0)

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
   * Uses article count + latest timestamp comparison for simplicity
   */
  const onNewsRefreshed = (articles: any[]) => {
    if (!articles || articles.length === 0) return

    const latestTimestamp = Math.max(...articles.map((a: any) =>
      new Date(a.publishedAt).getTime()
    ))

    // Trigger if: new articles OR newer article appeared
    if (articles.length !== lastArticleCount.value ||
        latestTimestamp > lastLatestTimestamp.value) {
      triggerAnalysisRefresh()
    }

    lastArticleCount.value = articles.length
    lastLatestTimestamp.value = latestTimestamp
  }

  return {
    shouldRefreshAnalysis: readonly(shouldRefreshAnalysis),
    triggerAnalysisRefresh,
    onNewsRefreshed,
    lastArticleCount: readonly(lastArticleCount),
    lastLatestTimestamp: readonly(lastLatestTimestamp)
  }
}