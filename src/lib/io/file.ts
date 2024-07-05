import fs from "fs/promises";
import { v4 } from "uuid";

export type FileData = {
  path: string;
  name: string;
  type: string;
  extension: string | null;
};

type GetExtension = (fileName: string) => string | null;
const getExtension: GetExtension = (fileName) => {
  const ret = fileName.match(new RegExp(".(.)+$"));

  if (ret && ret.length > 2) {
    const [_, value, ...rest] = ret;
    if (value) {
      return value; // TODO
    }
  }

  return null;
};

// TODO 例外処理？
type SaveTempFile = (file: File) => Promise<FileData>;
const saveTempFile: SaveTempFile = async (file) => {
  const fileName = file.name;
  const fileData = {
    path: `./public/uploads/${v4()}`,
    name: fileName,
    type: file.type,
    extension: getExtension(fileName),
  };

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  // const buffer = new Uint8Array(arrayBuffer);
  await fs.writeFile(fileData.path, buffer);

  return fileData;
};

export type LocalFile = {
  saveTempFile: SaveTempFile;
};

export type GetLocalFile = () => LocalFile;
export const getLocalFile: GetLocalFile = () => ({ saveTempFile });
