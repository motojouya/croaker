import { Storage as GoogleCloudStorage, UploadOptions } from '@google-cloud/storage';
import { v4 } from 'uuid';

export class FileError extends Error {
  constructor(
    readonly croaker_identifier: string,
    readonly action: string,
    readonly path: string,
    readonly exception: Error,
    readonly message: string,
  ) {
    super();
  }
}

// TODO contentTypeを判定するロジックも必要
// 判定したあとに、何を呼び出すかはcaseロジックの中でやればいい
// contentType 'text/plain' 'application/zip' 'image/jpeg' ...

type Upload = (from: string, to: string) => Promise<void>;
type Bucket = {
  upload: Upload;
};
type Storage = {
  getUploadFileBucket: () => Bucket;
}

let storage?: Storage = undefined;

type CreateStorage = () => Storage;
const createStorage: CreateStorage = () => {

  const googleCloudStorage = new GoogleCloudStorage({
    projectId: 'user-projectId',
    keyFilename: './key.json',
    credentials: {
      client_email,
      private_key,
    },
  });

  const getUploadFileBucket = () => {
    const innerBucket = googleCloudStorage.bucket('createbucket-69fd9e10-25eb-4311-aac3-9641fa49c247')
    return {
      upload: async (from, to) => {
        const dir = 'files';
        const destination = dir + '/' + to;
        await innerBucket.upload(from, { destination, gzip: true, });
      }
    }
  };

  return {
    getUploadFileBucket,
  }
}

export type GetStorage = () => Storage;
export const getStorage: GetStorage = () => {
  if (!storage) {
    storage = createStorage();
  }
  return storage;
};

export type UploadFile = (storage: Storage) => (localFilePath: string, extension: string) => Promise<string | FileError>;
export const uploadFile: UploadFile = async (localFilePath, extension) => {
  try {
    const storageFileName = `${v4()}.${extension}`;

    const bucket = storage.getUploadFileBucket();

    await bucket.upload(localFilePath, storageFileName);

    return destination;

  } catch (e) {
    return new FileError(
      actor.croaker_identifier,
      'upload',
      file_path,
      e,
      'ファイルアップロードできませんでした'
    );
  }
}


// npm i -D @types/imagemagick
// npm i node-imagemagick
import imageMagick from 'imagemagick';

// TODO
// 画像サイズが大きければ、横幅1000pxで縦横比は保持
// jpegのファイルサイズはquality85%に
// 90でもいいかも。オプションかな
const convert = () => {
  // imagemagickのコマンドを配列形式で指定する
  imageMagick.convert(['/path/image/image.png' '/path/image/image.jpg'], (err)=> {
    console.log('image magick convert finish')
  })

  // コマンド文字列を半スペでsplitするほうが使いやすい
  const cmd1 = `/path/image/image.png /path/image/image.jpg`
  imageMagick.convert(cmd1.split(' '), (err)=> {
    console.log('image magick convert finish')
  })

  // 一つの画像から複数種類の画像を書き出す場合のコマンド文字列例
  const cmd2 =
    `${file.path} `+
    `-resize 3840x1080 -write ${filePath}image.jpg ` +
    `-resize 1080x1080 -write ${filePath}imageProFile.jpg ` +
    `-resize 150x150 -write ${filePath}thumbnail.jpg`

  imageMagick.convert(cmd2.split(' '), (err)=> {
    console.log('image magick convert finish')
  })
};

const resizeOption = {
  srcPath: undefined,
  srcData: null,
  srcFormat: null,
  dstPath: undefined,
  quality: 0.8,
  format: 'jpg',
  progressive: false,
  width: 0,
  height: 0,
  strip: true,
  filter: 'Lagrange',
  sharpening: 0.2,
  customArgs: []
}

im.resize({
  srcPath: 'kittens.jpg',
  dstPath: 'kittens-small.jpg',
  width:   256
}, function(err, stdout, stderr){
  if (err) throw err;
  console.log('resized kittens.jpg to fit within 256x256px');
});

var fs = require('fs');
im.resize({
  srcData: fs.readFileSync('kittens.jpg', 'binary'),
  width:   256
}, function(err, stdout, stderr){
  if (err) throw err
  fs.writeFileSync('kittens-resized.jpg', stdout, 'binary');
  console.log('resized kittens.jpg to fit within 256x256px')
});

// im.convert(['kittens.jpg', '-resize', '25x120', 'kittens-small.jpg'],
// function(err, stdout){
//   if (err) throw err;
//   console.log('stdout:', stdout);
// });

// -profile:skip
// convert INPUT.gif_or_png -strip [-resize WxH] [-alpha Remove] OUTPUT.png
// convert cuppa.png -strip cuppa_converted.png

// convert INPUT.jpg -sampling-factor 4:2:0 -strip [-resize WxH] [-quality N] [-interlace JPEG] [-colorspace Gray/sRGB] OUTPUT.jpg
// convert puzzle.jpg -sampling-factor 4:2:0 -strip -quality 85 -interlace JPEG -colorspace sRGB puzzle_converted.jpg

// convert <変換前の画像名> -resize (width)x <変換後の画像名>
// convert before.jpg -resize 1080x after.jpg


