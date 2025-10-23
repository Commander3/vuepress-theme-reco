import { FileInfo } from "../types/index";
export function findFilesFromSeries(obj: Object, fileArray: Array<FileInfo>) {
  if (obj instanceof Array) {
    for (const item of obj) {
      findFilesFromSeries(item, fileArray);
    }
  } else if (obj instanceof Object) {
    if (Object.hasOwn(obj, "link") && Object.hasOwn(obj, "path")) {
      fileArray.push({ link: obj["link"] ?? "", path: obj["path"] ?? "" });
    } else {
      for (const key of Object.keys(obj)) {
        findFilesFromSeries(obj[key], fileArray);
      }
    }
  }
}
