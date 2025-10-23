import type { Section } from "../types/section";
import MiniSearch from 'minisearch';
class Searcher {
  // key: file path, value: sections in the file
  private fileSectionMap = new Map<string, Array<Section>>();
  private miniSearch = new MiniSearch({
    fields: ['title', 'titles', 'text'],
    storeFields: ['title', 'titles'],
  });
  private num = 0;

  addSection(filePath: string, section: Section) {
    this.num ++;
    if (!this.fileSectionMap.has(filePath)) {
      this.fileSectionMap.set(filePath, []);
    }
    try{
      this.miniSearch.add(section);
    } catch (error) {
      console.error(`\n[addSection] error: ${error}, filePath: ${filePath}, section: ${JSON.stringify(section)}`);
    }
    this.fileSectionMap.get(filePath)!.push(section);
  }
  search(query: string) {
    return this.miniSearch.search(query);
  }

  getJsonDocuments(): string {
    let documents: Array<{id: string, html: string}> = Array(this.num);
    let offset = 0;
    for (const [_, sections] of this.fileSectionMap) {
      for (const section of sections) {
        documents[offset] = {id: section.id, html: section.html};
        offset ++;
      }
    }
    return JSON.stringify(documents);
  }

  getIndexJson(): string {
    return JSON.stringify(this.miniSearch.toJSON());
  }
}

export const searcher = new Searcher();
