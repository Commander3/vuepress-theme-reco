// src/composables/useSearch.ts
import { ref, onMounted } from "vue";
import MiniSearch from "minisearch";
import pako from "pako";

export interface SearchResult {
  id: string;
  title: string;
  titles: string[];
  text: string;
}
class SearchService {
  private miniSearch: MiniSearch<SearchResult> | null = null;
  private isLoading = ref(false);
  private isReady = ref(false);
  private error = ref<string | null>(null);
  private retryCount = 0;
  private maxRetries = 3;

  constructor() {
    this.initSearch();
  }

  private async initSearch() {
    try {
      this.isLoading.value = true;
      this.error.value = null;

      // 尝试从缓存加载
      const cachedData = this.getCachedData();
      if (cachedData) {
        this.miniSearch = MiniSearch.loadJSON(cachedData, {
          fields: ["title", "titles", "text"],
          storeFields: ["title", "titles"],
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: { title: 4, text: 2, titles: 1 },
          },
        });
        this.isReady.value = true;
        console.log("✅ Search data loaded from cache");
        return;
      }
      await this.loadFromNetwork();
    } catch (err) {
      this.handleError(err);
    } finally {
      this.isLoading.value = false;
    }
  }

  private async loadFromNetwork() {
    const indexResponse = await this.fetchWithFallback(
      "/minisearch-index.json",
      "/minisearch-index.json"
    );


    // 检查响应状态
    if (!indexResponse.ok) {
      throw new Error(`Failed to load search index: ${indexResponse.status}`);
    }

    const indexData = await this.processResponse(indexResponse);

    this.miniSearch = MiniSearch.loadJSON(indexData, {
      fields: ["title", "titles", "text"],
      storeFields: ["title", "titles"],
      searchOptions: {
        fuzzy: 0.2,
        prefix: true,
        boost: { title: 4, text: 2, titles: 1 },
      },
    });

    // 缓存数据
    this.cacheData(indexData);

    this.isReady.value = true;
    console.log("✅ Search index and documents loaded successfully");
  }

  private async fetchWithFallback(
    compressedUrl: string,
    fallbackUrl: string
  ): Promise<Response> {
    try {
      const response = await fetch(compressedUrl);
      if (response.ok) {
        return response;
      }
    } catch (error) {
      console.warn(
        `Failed to load compressed file ${compressedUrl}, trying fallback`
      );
    }

    return fetch(fallbackUrl);
  }

  private async processResponse(response: Response): Promise<any> {
    const url = response.url;
    if (url.endsWith(".gz")) {
      // 处理压缩文件
      const compressed = await response.arrayBuffer();
      const decompressed = pako.inflate(new Uint8Array(compressed), {
        to: "string",
      });
      return JSON.parse(decompressed);
    } else {
      // 处理普通JSON文件
      return response.json();
    }
  }

  private getCachedData() {
    try {
      const cached = localStorage.getItem("minisearch-cache");
      if (!cached) return null;

      const { index, timestamp } = JSON.parse(cached);

      // 检查缓存是否过期（24小时）
      const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000;
      if (isExpired) return null;

      return index;
    } catch {
      return null;
    }
  }

  private cacheData(index: any) {
    try {
      const cacheData = {
        index,
        timestamp: Date.now(),
      };
      localStorage.setItem("minisearch-cache", JSON.stringify(cacheData));
    } catch (err) {
      console.warn("Failed to cache search data:", err);
    }
  }

  private handleError(err: any) {
    this.error.value = err instanceof Error ? err.message : "Unknown error";

    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(
        `Retrying search data load (${this.retryCount}/${this.maxRetries})...`
      );

      setTimeout(() => {
        this.initSearch();
      }, 1000 * this.retryCount); // 递增延迟
    } else {
      console.error("❌ Failed to load search data after all retries");
    }
  }

  // 搜索方法
  search(query: string): SearchResult[] {
    if (!this.miniSearch || !this.isReady.value) {
      console.warn("Search not ready yet");
      return [];
    }

    if (!query.trim()) {
      return [];
    }

    const results = this.miniSearch.search(query);

    // 为每个结果添加HTML内容
    return results.map((result) => ({
      id: result.id,
      title: result.title || "",
      titles: result.titles || [],
      text: result.text || "",
    }));
  }

  // 获取状态
  get loading() {
    return this.isLoading.value;
  }
  get ready() {
    return this.isReady.value;
  }
  get hasError() {
    return !!this.error.value;
  }
  get errorMessage() {
    return this.error.value;
  }
}

// 单例模式
let searchService: SearchService | null = null;

export function useSearch() {
  if (!searchService) {
    searchService = new SearchService();
  }

  return {
    search: (query: string): SearchResult[] => searchService!.search(query),
    loading: searchService!.loading,
    ready: searchService!.ready,
    hasError: searchService!.hasError,
    errorMessage: searchService!.errorMessage,
  };
}
