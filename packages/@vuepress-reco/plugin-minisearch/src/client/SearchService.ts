// src/composables/useSearch.ts
import { ref, onMounted } from 'vue'
import MiniSearch from 'minisearch'
import pako from 'pako'

interface SearchResult {
  id: string
  title: string
  titles: string[]
  text: string
  html: string
}

class SearchService {
  private miniSearch: MiniSearch<SearchResult> | null = null
  private documents: Map<string, string> = new Map()
  private isLoading = ref(false)
  private isReady = ref(false)
  private error = ref<string | null>(null)
  private retryCount = 0
  private maxRetries = 3

  constructor() {
    this.initSearch()
  }

  private async initSearch() {
    try {
      this.isLoading.value = true
      this.error.value = null

      // 尝试从缓存加载
      const cachedData = this.getCachedData()
      if (cachedData) {
        this.miniSearch = MiniSearch.loadJSON(cachedData.index, {
          fields: ['title', 'titles', 'text'],
          storeFields: ['title', 'titles']
        })
        this.documents = new Map(cachedData.documents)
        this.isReady.value = true
        console.log('✅ Search data loaded from cache')
        return
      }

      // 从网络并行加载（支持压缩文件）
      await this.loadFromNetwork()

    } catch (err) {
      this.handleError(err)
    } finally {
      this.isLoading.value = false
    }
  }

  private async loadFromNetwork() {
    // 并行加载两个文件（优先尝试压缩版本）
    const [indexResponse, documentsResponse] = await Promise.all([
      this.fetchWithFallback('/minisearch-index.json.gz', '/minisearch-index.json'),
      this.fetchWithFallback('/minisearch-documents.json.gz', '/minisearch-documents.json')
    ])

    // 检查响应状态
    if (!indexResponse.ok) {
      throw new Error(`Failed to load search index: ${indexResponse.status}`)
    }
    if (!documentsResponse.ok) {
      throw new Error(`Failed to load search documents: ${documentsResponse.status}`)
    }

    // 并行处理数据
    const [indexData, documentsData] = await Promise.all([
      this.processResponse(indexResponse),
      this.processResponse(documentsResponse)
    ])

    // 构建文档映射
    this.documents = new Map(documentsData.map((item: {id: string, html: string}) => [item.id, item.html]))

    // 使用MiniSearch.loadJSON创建搜索实例
    this.miniSearch = MiniSearch.loadJSON(indexData, {
      fields: ['title', 'titles', 'text'],
      storeFields: ['title', 'titles'],
      searchOptions: {
        fuzzy: 0.2,
        prefix: true,
        boost: { title: 4, text: 2, titles: 1 },
      }
    })

    // 缓存数据
    this.cacheData(indexData, documentsData)

    this.isReady.value = true
    console.log('✅ Search index and documents loaded successfully')
  }

  private async fetchWithFallback(compressedUrl: string, fallbackUrl: string): Promise<Response> {
    try {
      const response = await fetch(compressedUrl)
      if (response.ok) {
        return response
      }
    } catch (error) {
      console.warn(`Failed to load compressed file ${compressedUrl}, trying fallback`)
    }

    return fetch(fallbackUrl)
  }

  private async processResponse(response: Response): Promise<any> {
    const url = response.url

    if (url.endsWith('.gz')) {
      // 处理压缩文件
      const compressed = await response.arrayBuffer()
      const decompressed = pako.inflate(new Uint8Array(compressed), { to: 'string' })
      return JSON.parse(decompressed)
    } else {
      // 处理普通JSON文件
      return response.json()
    }
  }

  private getCachedData() {
    try {
      const cached = localStorage.getItem('minisearch-cache')
      if (!cached) return null

      const { index, documents, timestamp } = JSON.parse(cached)

      // 检查缓存是否过期（24小时）
      const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000
      if (isExpired) return null

      return { index, documents }
    } catch {
      return null
    }
  }

  private cacheData(index: any, documents: any[]) {
    try {
      const cacheData = {
        index,
        documents,
        timestamp: Date.now()
      }
      localStorage.setItem('minisearch-cache', JSON.stringify(cacheData))
    } catch (err) {
      console.warn('Failed to cache search data:', err)
    }
  }

  private handleError(err: any) {
    this.error.value = err instanceof Error ? err.message : 'Unknown error'

    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      console.log(`Retrying search data load (${this.retryCount}/${this.maxRetries})...`)

      setTimeout(() => {
        this.initSearch()
      }, 1000 * this.retryCount) // 递增延迟
    } else {
      console.error('❌ Failed to load search data after all retries')
    }
  }

  // 搜索方法
  search(query: string): SearchResult[] {
    if (!this.miniSearch || !this.isReady.value) {
      console.warn('Search not ready yet')
      return []
    }

    if (!query.trim()) {
      return []
    }

    const results = this.miniSearch.search(query)

    // 为每个结果添加HTML内容
    return results.map(result => ({
      id: result.id,
      title: result.title || '',
      titles: result.titles || [],
      text: result.text || '',
      html: this.documents.get(result.id) || ''
    }))
  }

  // 获取状态
  get loading() { return this.isLoading.value }
  get ready() { return this.isReady.value }
  get hasError() { return !!this.error.value }
  get errorMessage() { return this.error.value }
}

// 单例模式
let searchService: SearchService | null = null

export function useSearch() {
  if (!searchService) {
    searchService = new SearchService()
  }

  return {
    search: (query: string): SearchResult[] => searchService!.search(query),
    loading: searchService!.loading,
    ready: searchService!.ready,
    hasError: searchService!.hasError,
    errorMessage: searchService!.errorMessage
  }
}
