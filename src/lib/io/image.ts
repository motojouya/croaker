import { v4 } from "uuid";
import imageMagick, { Features } from "imagemagick";
import { ImageInformationFail, ImageCommandFail } from "@/lib/io/imageFail";

type Convert = (filePath: string) => Promise<string | ImageCommandFail | ImageInformationFail>;
const convert: Convert = async (filePath) => {
  const imageInfo = await getInformation(filePath);
  if (imageInfo instanceof ImageCommandFail) {
    return imageInfo;
  }

  const validContentType = imageInfo.format === "jpg" || imageInfo.format === "png" || imageInfo.format === "gif";
  if (!imageInfo.format || !validContentType) {
    return new ImageInformationFail("format", String(imageInfo.format), filePath, "image形式はjpeg,png,gifのみです");
  }

  if (!imageInfo.width) {
    return new ImageInformationFail("width", String(imageInfo.width), filePath, "幅がありません");
  }

  const width = imageInfo.width > 1000 ? 1000 : imageInfo.width;

  if (imageInfo.format === "jpg") {
    const resizedJpegPath = `temp/${v4()}.jpeg`;
    const error = await resizeJpeg(filePath, resizedJpegPath, width);
    if (error) {
      return error;
    }
    return resizedJpegPath;
  }

  let resizedFilePath: string;
  if (imageInfo.format === "png") {
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

type GetInformation = (filePath: string) => Promise<Features | ImageCommandFail>;
const getInformation: GetInformation = async (filePath) => {
  return new Promise((resolve) => {
    imageMagick.identify(filePath, (error, features) => {
      if (error) {
        resolve(new ImageCommandFail("identify", filePath, error, "imageファイルを読み込めません"));
      } else {
        resolve(features);
      }
    });
  });
};

type ResizeImage = (
  filePath: string,
  resizedPath: string,
  width: number,
  format: string,
) => Promise<null | ImageCommandFail>;
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
        resolve(new ImageCommandFail("resize", filePath, error, "imageファイルのサイズ変更ができません"));
      } else {
        resolve(null);
      }
    });
  });
};

type ResizeJpeg = (filePath: string, resizedPath: string, width: number) => Promise<null | ImageCommandFail>;
const resizeJpeg: ResizeJpeg = async (filePath, resizedPath, width) => {
  const resizeOption = {
    srcPath: filePath,
    srcFormat: "jpg",
    dstPath: resizedPath,
    format: "jpg",
    quality: 0.9,
    width: width,
    strip: true,
  };
  return new Promise((resolve) => {
    imageMagick.resize(resizeOption, (error) => {
      if (error) {
        resolve(new ImageCommandFail("resize", filePath, error, "imageファイルのサイズ変更ができません"));
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
