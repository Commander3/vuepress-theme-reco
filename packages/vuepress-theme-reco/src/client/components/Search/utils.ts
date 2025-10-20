export function pathToFile(path: string) {
  // TODO fill the path map functionality
  // let pagePath = path.replace(/\.html$/, '')
  // pagePath = decodeURIComponent(pagePath)
  // pagePath = pagePath.replace(/\/$/, '/index') // /foo/ -> /foo/index
  // if (import.meta.env.DEV) {
  //   // always force re-fetch content in dev
  //   pagePath += `.md?t=${Date.now()}`
  // } else {
  //   // in production, each .md file is built into a .md.js file following
  //   // the path conversion scheme.
  //   // /foo/bar.html -> ./foo_bar.md
  //   if (inBrowser) {
  //     const base = import.meta.env.BASE_URL
  //     pagePath =
  //       sanitizeFileName(
  //         pagePath.slice(base.length).replace(/\//g, '_') || 'index'
  //       ) + '.md'
  //     // client production build needs to account for page hash, which is
  //     // injected directly in the page's html
  //     let pageHash = __VP_HASH_MAP__[pagePath.toLowerCase()]
  //     if (!pageHash) {
  //       pagePath = pagePath.endsWith('_index.md')
  //         ? pagePath.slice(0, -9) + '.md'
  //         : pagePath.slice(0, -3) + '_index.md'
  //       pageHash = __VP_HASH_MAP__[pagePath.toLowerCase()]
  //     }
  //     if (!pageHash) return null
  //     pagePath = `${base}${__ASSETS_DIR__}/${pagePath}.${pageHash}.js`
  //   } else {
  //     // ssr build uses much simpler name mapping
  //     pagePath = `./${sanitizeFileName(
  //       pagePath.slice(1).replace(/\//g, '_')
  //     )}.md.js`
  //   }
  // }

  // return pagePath
  return path;
}

export function escapeRegExp(str: string) {
  return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d')
}

// adapted from https://stackoverflow.com/a/46432113/11613622

export class LRUCache<K, V> {
  private max: number
  private cache: Map<K, V>

  constructor(max: number = 10) {
    this.max = max
    this.cache = new Map<K, V>()
  }

  get(key: K): V | undefined {
    let item = this.cache.get(key)
    if (item !== undefined) {
      // refresh key
      this.cache.delete(key)
      this.cache.set(key, item)
    }
    return item
  }

  set(key: K, val: V): void {
    // refresh key
    if (this.cache.has(key)) this.cache.delete(key)
    // evict oldest
    else if (this.cache.size === this.max) this.cache.delete(this.first()!)
    this.cache.set(key, val)
  }

  first(): K | undefined {
    return this.cache.keys().next().value
  }

  clear(): void {
    this.cache.clear()
  }
}

/**
 * @param themeObject Can be an object with `translations` and `locales` properties
 */
// export function createSearchTranslate(
//   defaultTranslations: Record<string, any>
// ): (key: string) => string {
//   const { localeIndex, theme } = useData()

//   function translate(key: string): string {
//     const keyPath = key.split('.')
//     const themeObject = theme.value.search?.options

//     const isObject = themeObject && typeof themeObject === 'object'
//     const locales =
//       (isObject && themeObject.locales?.[localeIndex.value]?.translations) ||
//       null
//     const translations = (isObject && themeObject.translations) || null

//     let localeResult: Record<string, any> | null = locales
//     let translationResult: Record<string, any> | null = translations
//     let defaultResult: Record<string, any> | null = defaultTranslations

//     const lastKey = keyPath.pop()!
//     for (const k of keyPath) {
//       let fallbackResult: Record<string, any> | null = null
//       const foundInFallback: any = defaultResult?.[k]
//       if (foundInFallback) {
//         fallbackResult = defaultResult = foundInFallback
//       }
//       const foundInTranslation: any = translationResult?.[k]
//       if (foundInTranslation) {
//         fallbackResult = translationResult = foundInTranslation
//       }
//       const foundInLocale: any = localeResult?.[k]
//       if (foundInLocale) {
//         fallbackResult = localeResult = foundInLocale
//       }
//       // Put fallback into unresolved results
//       if (!foundInFallback) {
//         defaultResult = fallbackResult
//       }
//       if (!foundInTranslation) {
//         translationResult = fallbackResult
//       }
//       if (!foundInLocale) {
//         localeResult = fallbackResult
//       }
//     }
//     return (
//       localeResult?.[lastKey] ??
//       translationResult?.[lastKey] ??
//       defaultResult?.[lastKey] ??
//       ''
//     )
//   }

//   return translate
// }
