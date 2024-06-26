import { v4 } from 'uuid';
import imageMagick, { Features } from 'imagemagick';
import { HandleableError } from '@/lib/base/error';

type Convert = (filePath: string) => Promise<string | ImageCommandError | ImageInformationError>;
const convert: Convert = async (filePath) => {

  const imageInfo = await getInformation(filePath);
  if (imageInfo instanceof ImageCommandError) {
    return imageInfo;
  }

  const validContentType =
    imageInfo.format === 'jpg' ||
    imageInfo.format === 'png' ||
    imageInfo.format === 'gif';
  if (!imageInfo.format || !validContentType) {
    return new ImageInformationError('format', String(imageInfo.format), filePath, 'image形式はjpeg,png,gifのみです');
  }

  if (!imageInfo.width) {
    return new ImageInformationError('width', String(imageInfo.width), filePath, '幅がありません');
  }

  const width = imageInfo.width > 1000 ? 1000 : imageInfo.width;

  if (imageInfo.format === 'jpg') {
    const resizedJpegPath = `temp/${v4()}.jpeg`;
    const error = await resizeJpeg(filePath, resizedJpegPath, width);
    if (error) {
      return error;
    }
    return resizedJpegPath;
  }

  let resizedFilePath: string;
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

export class ImageInformationError extends HandleableError {
  override readonly name = 'lib.image.ImageInformationError' as const;
  constructor(
    readonly key: string,
    readonly value: string,
    readonly path: string,
    readonly message: string,
  ) {
    super();
  }
}

export class ImageCommandError extends HandleableError {
  override readonly name = 'lib.image.ImageCommandError' as const;
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
// type Features = {
//   format: string; // 'JPEG',
//   width: number; // 3904,
//   height: number; // 2622,
//   depth: number; // 8,
// };

type GetInformation = (filePath: string) => Promise<Features | ImageCommandError>
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
        resolve(null);
      }
    });
  });
};

export type ImageFile = {
  convert: Convert;
};
export const getImageFile = () => ({ convert });
