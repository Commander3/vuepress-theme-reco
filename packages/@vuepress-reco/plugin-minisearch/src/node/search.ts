import type { Section } from "../types/section";
import MiniSearch from 'minisearch';
class Searcher {
  // key: file path, value: sections in the file
  private fileSectionMap = new Map<string, Array<Section>>();
  private miniSearch = new MiniSearch({
    fields: ['title', 'titles', 'text'],
    storeFields: ['title', 'titles'],
  });
  private currentId = 0;
  private fileHtmlContentMap = new Map<string, Map<string, string>>();

  addSection(filePath: string, section: Section, htmlContent: string) {
    if (!this.fileSectionMap.has(filePath)) {
      this.fileSectionMap.set(filePath, []);
      this.fileHtmlContentMap.set(filePath, new Map<string, string>());
    }
    try{
      this.miniSearch.add(section);
    } catch (error) {
      console.error(`\n[addSection] error: ${error}, filePath: ${filePath}, section: ${JSON.stringify(section)}`);
    }
    this.fileSectionMap.get(filePath)!.push(section);
    this.fileHtmlContentMap.get(filePath)!.set(section.id, htmlContent);
  }
  search(query: string) {
    return this.miniSearch.search(query);
  }

  get nextId() {
    return ++this.currentId;
  }

  getHtmlContent(filePath: string, id: string) {
    if (this.fileHtmlContentMap.has(filePath)) {
      return this.fileHtmlContentMap.get(filePath)!.get(id);
    }
    return null;
  }

  getIndexJson() {
    return this.miniSearch.toJSON();
  }
  
}

export const searcher = new Searcher();
