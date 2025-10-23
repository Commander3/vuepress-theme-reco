import type { Section } from "../types/section";
import MiniSearch from "minisearch";
class Searcher {
  // key: file path, value: sections in the file
  private miniSearch = new MiniSearch({
    fields: ["title", "titles", "text"],
    storeFields: ["title", "titles"],
  });

  addSection(filePath: string, section: Section) {
    try {
      this.miniSearch.add(section);
    } catch (error) {
      console.error(
        `\n[addSection] error: ${error}, filePath: ${filePath}, section: ${JSON.stringify(
          section
        )}`
      );
    }
  }
  search(query: string) {
    return this.miniSearch.search(query);
  }

  getIndexJson(): string {
    return JSON.stringify(this.miniSearch.toJSON());
  }
}

export const searcher = new Searcher();
