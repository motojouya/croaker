import { v4 } from 'uuid';
import imageMagick from 'imagemagick';
// npm i -D @types/imagemagick
// npm i node-imagemagick

export type Convert = (filePath: string) => Promise<string | ImageCommandError | ImageFormatError>;
export const convert: Convert = async (filePath) => {

  const imageInfo = getInformation(filePath);
  if (imageInfo instanceof ImageCommandError) {
    return imageInfo;
  }

  const validContentType =
    imageInfo.format === 'jpg' ||
    imageInfo.format === 'png' ||
    imageInfo.format === 'gif';
  if (!validContentType) {
    return new ImageFormatError(imageInfo.format, filePath, 'image形式はjpeg,png,gifのみです');
  }

  const width = imageInfo.width > 1000 ? 1000 : imageInfo.width;

  if (imageInfo.format === 'jpg') {
    const error = await resizeJpeg(filePath, `temp/${v4()}.jpeg`, width);
    if (error) {
      return error;
    }
    return resizedFilePath;
  }

  let resizedFilePath = undefined;
  if (imageInfo.format === 'png') {
    resizedFilePath = `temp/${v4()}.png`;
  } else {
    resizedFilePath = `temp/${v4()}.gif`;
  }

  const error = await resizeImage(filePath, resizedFilePath, width, imageInfo.format);
  if (error) {
    return error;
  }
  return resizedFilePath;
};

export class ImageFormatError extends Error {
  constructor(
    readonly format: string,
    readonly path: string,
    readonly message: string,
  ) {
    super();
  }
}

export class ImageCommandError extends Error {
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

type GetInformation = (filePath: string) => Promise<ImageFeatures | ImageCommandError>
const getInformation: GetInformation = async (filePath) => {
  return new Promise((resolve) => {
    imageMagick.identify(filePath, (error, features) => {
      if (error) {
        resolve(new ImageCommandError('identify', filePath, error, 'imageファイルを読み込めません'));
      } else {
        resolve(features);
      }
    });
  });
};

type ResizeImage = (filePath: string, resizedPath: string, width: number, format: string) => Promise<null | ImageCommandError>
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
        resolve(new ImageCommandError('resize', filePath, error, 'imageファイルのサイズ変更ができません'));
      } else {
        resolve(null);
      }
    });
  });
};

type ResizeJpeg = (filePath: string, resizedPath: string, width: number) => Promise<null | ImageCommandError>
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
        resolve(new ImageCommandError('resize', filePath, error, 'imageファイルのサイズ変更ができません'));
      } else {
        resolve(features);
      }
    });
  });
};
