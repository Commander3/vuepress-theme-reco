import type { Plugin } from 'vuepress/core'
import { Markdown } from '@vuepress/markdown'
import { findFilesFromSeries } from './util.js'
let mdObject: Markdown | undefined = undefined;
import { scanForBuild, saveJsonDocuments, saveIndexJson } from './load.js';
import type { App } from 'vuepress/core'
export const minisearchPlugin = (themeConfig: any): Plugin => ({
  name: '@vuepress-reco/vuepress-plugin-minisearch',
  extendsMarkdown: (md: Markdown) => {
    mdObject = md;
  },
  onPrepared: async (app: App) => {
    if (typeof mdObject === 'undefined') {
      return;
    }
    let series = themeConfig.series || {};
    let fileArray: Array<{link: string, path: string}> = [];
    // 先拿一个key做实验
    if (series instanceof Object) {
      if (Object.hasOwn(series, "/docs/dev-guide/")) {
        let devGuideObj = series["/docs/dev-guide/"];
        findFilesFromSeries(devGuideObj, fileArray);
      }
      if (Object.hasOwn(series, "/docs/std/")) {
        let stdObj = series["/docs/std/"];
        findFilesFromSeries(stdObj, fileArray);
      }
      if (Object.hasOwn(series, "/docs/tools/")) {
        let toolsObj = series["/docs/tools/"];
        findFilesFromSeries(toolsObj, fileArray);
      }
      await scanForBuild(fileArray, mdObject);
      await saveJsonDocuments(app.dir.dest('assets/minisearch-documents.json'));
      await saveIndexJson(app.dir.dest('assets/minisearch-index.json'));
    }
  },
  onGenerated: async (app) => {
    // const files = readdirSync(app.dir.dest('assets'))
    // let styleFileName = ''
    // files.forEach((file) => {
    //   if (/\.css/.test(file)) {
    //     styleFileName = file
    //   }
    // })
    console.log(`[minisearchPlugin] onGenerated`);
  }
})
