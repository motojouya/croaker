import fs from 'fs/promises';
import { v4 } from 'uuid';

export type FileData = {
  path: string;
  name: string;
  type: string;
};

// TODO 例外処理？
type SaveTempFile = (file: File) => Promise<FileData>;
const saveTempFile: SaveTempFile = async (file) => {
  const fileData = {
    path: `./public/uploads/${v4()}`,
    name: file.name,
    type: file.type
  };

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  // const buffer = new Uint8Array(arrayBuffer);
  await fs.writeFile(fileData.path, buffer);

  return fileData;
};

export type LocalFile = {
  saveTempFile: SaveTempFile,
};

export type GetLocalFile = () => LocalFile;
export const getLocalFile: GetLocalFile = () => ({ saveTempFile });
