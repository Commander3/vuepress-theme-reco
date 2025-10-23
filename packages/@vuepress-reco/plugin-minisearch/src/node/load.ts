import fs from 'node:fs'
import pMap from 'p-map'
import { Markdown } from '@vuepress/markdown'
import { Section } from '../types/section'
import { searcher } from './search.js'
import { FileInfo } from '../types/index'
const headingRegex = /<h(\d*).*?>(.*?<a.*? href="#.*?".*?>.*?<\/a>)<\/h\1>/gi
const headingContentRegex = /(.*)<a.*? href="#(.*?)".*?>.*?<\/a>/i

function clearHtmlTags(str: string) {
  return str.replace(/<[^>]*>/g, '')
}

function getSearchableText(content: string) {
  content = clearHtmlTags(content)
  return content
}
/**
 * Splits HTML into sections based on headings
 */
function* splitPageIntoSections(html: string): Generator<{ anchor: string, titles: string[], text: string, htmlContent: string }> {
  let result = html.split(headingRegex)
  result.shift();
  let parentTitles: string[] = []
  for (let i = 0; i < result.length; i += 3) {
    const level = parseInt(result[i]) - 1
    const heading = result[i + 1]
    const headingResult = headingContentRegex.exec(heading)
    // console.log(`\n[splitPageIntoSections] headingResult: ${JSON.stringify(headingResult)}`);
    const title = clearHtmlTags(headingResult?.[2] ?? '').trim()
    // console.log(`\n[splitPageIntoSections] title: ${title}`);
    const anchor = headingResult?.[2] ?? ''
    // console.log(`\n[splitPageIntoSections] anchor: ${anchor}`);
    const content = result[i + 2]
    // console.log(`\n[splitPageIntoSections] content: ${content}`);
    if (!title || !content) continue
    let titles = parentTitles.slice(0, level)
    titles[level] = title
    titles = titles.filter(Boolean)
    yield { anchor, titles, text: getSearchableText(content), htmlContent: content }
    if (level === 0) {
      parentTitles = [title]
    } else {
      parentTitles[level] = title
    }
  }
}

async function indexFile(file: FileInfo, md: Markdown) {
  const content = await fs.promises.readFile(file.path, 'utf-8');
  const html = await new Promise<string>((resolve, reject) => {
    try {
      let html: string = md.render(content);
      resolve(html);
    } catch (error) {
      console.error(`[indexFile] file: ${file.path} error: ${error}`);
      reject(error);
    }
  });
  const sections = splitPageIntoSections(html);
  for await (const section of sections) {
    if (!section || !(section.text || section.titles)) break;
    const { anchor, titles, text, htmlContent } = section;
    const docSection: Section = {
      id: titles.length === 1 ? `${file.link}` : `${file.link}#${anchor}`,
      title: titles[titles.length - 1],
      titles: titles.slice(0, -1),
      text,
      html: htmlContent,
    };
    searcher.addSection(file.path, docSection);
  }
}

export async function scanForBuild(fileArray: Array<FileInfo>, md: Markdown) {
  console.log('🔍️ Indexing files for search...')
  let startTime = Date.now();
  await pMap(fileArray, async (file) => {
    await indexFile(file, md);
  }, {
    concurrency: 5
  });
  let endTime = Date.now();
  console.log(`✅ Indexing finished in ${endTime - startTime}ms`)
}

export async function saveJsonDocuments(documentsPath: string) {
  let documentsJson = searcher.getJsonDocuments();
  // If the file does not exist, create it
  await fs.promises.writeFile(documentsPath, documentsJson, { mode: 0o644 });
}

export async function saveIndexJson(indexPath: string) {
  let indexJson = searcher.getIndexJson();
  await fs.promises.writeFile(indexPath, indexJson, { mode: 0o644 });
}
