import { v4 } from 'uuid';
import imageMagick from 'imagemagick';
// npm i -D @types/imagemagick
// npm i node-imagemagick

export const CONTENT_TYPE_JPEG = 'image/jpeg';
export const CONTENT_TYPE_PNG = 'image/png';
export const CONTENT_TYPE_GIF = 'image/gif';
export type ContentTypeImages = CONTENT_TYPE_JPEG | CONTENT_TYPE_PNG | CONTENT_TYPE_GIF;

export type Convert = (filePath: string) => Promise<string>;
export const convert: Convert = async (filePath) => {

  const imageInfo = getInformation(filePath);

  const validContentType =
    imageInfo.format === 'jpg' ||
    imageInfo.format === 'png' ||
    imageInfo.format === 'gif';
  if (!validContentType) {
    return null;
  }

  const width = imageInfo.width > 1000 ? 1000 : imageInfo.width;

  if (imageInfo.format === 'jpg') {
    await resizeImage(filePath, `temp/${v4()}.jpeg`, width);
    return resizedFilePath;
  }

  let resizedFilePath = undefined;
  if (imageInfo.format === 'png') {
    resizedFilePath = `temp/${v4()}.png`;
  } else {
    resizedFilePath = `temp/${v4()}.gif`;
  }

  await resizeImage(filePath, resizedFilePath, width, imageInfo.format);
  return resizedFilePath;
};

export class ImageError extends Error {
  constructor(
    readonly action: string,
    readonly path: string,
    readonly exception: Error,
    readonly message: string,
  ) {
    super();
  }
}

// TODO すでに型がありそう
type ImageFeatures = {
  format: string; // 'JPEG',
  width: number; // 3904,
  height: number; // 2622,
  depth: number; // 8,
};

type GetInformation = (filePath: string) => Promise<ImageFeatures | ImageError>
const getInformation: GetInformation = async (filePath) => {
  return new Promise((resolve) => {
    imageMagick.identify(filePath, (error, features) => {
      if (error) {
        resolve(new ImageError('identify', filePath, error, 'imageファイルを読み込めません'));
      } else {
        resolve(features);
      }
    });
  });
};

type ResizeImage = (filePath: string, resizedPath: string, width: number, format: string) => Promise<null | ImageError>
const resizeImage: ResizeImage = async (filePath, resizedPath, width, format) => {
  const resizeOption = {
    srcPath: filePath,
    srcFormat: format, // gif png
    dstPath: resizedPath,
    format: format, // gif png
    width: width,
    strip: true,
  };
  return new Promise((resolve) => {
    imageMagick.resize(resizeOption, (error) => {
      if (error) {
        resolve(new ImageError('resize', filePath, error, 'imageファイルのサイズ変更ができません'));
      } else {
        resolve(features);
      }
    });
  });
};

type ResizeJpeg = (filePath: string, resizedPath: string, width: number) => Promise<null | ImageError>
const resizeJpeg: ResizeJpeg = async (filePath, resizedPath, width) => {
  const resizeOption = {
    srcPath: filePath,
    srcFormat: 'jpg',
    dstPath: resizedPath,
    format: 'jpg',
    quality: 0.9,
    width: width,
    strip: true,
  };
  return new Promise((resolve) => {
    imageMagick.resize(resizeOption, (error) => {
      if (error) {
        resolve(new ImageError('resize', filePath, error, 'imageファイルのサイズ変更ができません'));
      } else {
        resolve(features);
      }
    });
  });
};
