import { Kysely, NotNull, Null } from 'kysely'
import { add, compareAsc } from 'date-fns';

import { Croak } from '@/rdb/query/croak';
import { Actor } from '@/lib/session'; // TODO
import { create, delete, read } from '@/lib/repository';
import { getRoleAuthority } from '@/lib/role'
import { getLastCroak } from '@/rdb/query/getLastCroak';
import {
  Duration,
  getDuration,
  toStringDuration,
} from '@/lib/interval';
import {
  POST_AUTHORITY_TOP,
  POST_AUTHORITY_THREAD,
  POST_AUTHORITY_DISABLE,
  CROAKER_STATUS_BANNED,
  CROAKER_STATUS_ACTIVE,
} from '@/rdb/type/master';
import { InvalidArgumentsError, AuthorityError } from '@/lib/validation';

import { Storage, UploadOptions } from '@google-cloud/storage';
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

type uploadFile = () => Promise<string>;
const uploadFile = () => {
  try {
    const storage = new Storage({
      projectId: 'user-projectId',
      keyFilename: './key.json',
      credentials: require('cred.json'),
    });
    const bucket = storage.bucket('createbucket-69fd9e10-25eb-4311-aac3-9641fa49c247');

    const options: UploadOptions = {
      contentType: 'text/plain', // 'application/zip' 'image/jpeg' ...
      destination: `${v4()}/uploadFile.txt`, // TODO 拡張子
      gzip: true,
      preconditionOpts: { ifGenerationMatch: generationMatchPrecondition },
      cacheControl: 'public, max-age=600', // TODO 必要？
      contentLanguage: 'ja' // TODO 必要？
    };

    await bucket.upload('./src/cloudStorage/object/uploadFile.txt', options);
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


type PostCroak = (rdb: Kysely, actor: Actor) => (text: string, thread?: number) => Promise<Croak | AuthorityError | InvalidArgumentsError>;
const postCroak: PostCroak = (rdb, actor) => async (text, thread) => {

  if (!text) {
    return new InvalidArgumentsError(actor.croaker_identifier, 'text', text, 'textが空です');
  }

  if (actor.status == CROAKER_STATUS_BANNED) {
    return new AuthorityError(actor.croaker_identifier, 'banned', 'ブロックされたユーザです');
  }

  if (!actor.form_agreement) {
    return new AuthorityError(actor.croaker_identifier, 'form_agreement', '投稿前にプロフィールの編集とお願いへの同意をしてください');
  }

  const actorAuthority = read(rdb, 'role', { role_name: actor.role_name });

  if (actorAuthority.post === POST_AUTHORITY_DISABLE) {
    return new AuthorityError(actor.croaker_identifier, 'post_disable', '投稿することはできません');
  }

  if (thread && thread < 1) {
    return new InvalidArgumentsError(actor.croaker_identifier, 'thread', thread, 'threadは1以上の整数です');
  }

  if (actorAuthority.post === POST_AUTHORITY_THREAD && !thread) {
    return new AuthorityError(actor.croaker_identifier, 'post_thread', 'スレッド上にのみ投稿することができます');
  }

  const lastCroak = getLastCroak(rdb)(actor.user_id);
  const duration = getDuration(actorAuthority.top_post_interval);
  const croakTimePassed = !!compareAsc(add(lastCroak.posted_date, duration), new Date());

  if (actorAuthority.post === POST_AUTHORITY_TOP && !croakTimePassed) {
    const durationText = toStringDuration(duration);
    return new AuthorityError(actor.croaker_identifier, 'post_thread', `前回の投稿から${durationText}以上たってから投稿してください`);
  }

  // TODO contentsの中身から、linkを取り出し、OGPを取得してlinkテーブルにいれる

  return await create(rdb, 'croak', {
    user_id: actor.user_id;
    contents: contents,
    file_path: filePath,
    thread: thread,
  });
};

type PostFile = (rdb: Kysely, actor: Actor) => (filePath: string, thread?: number) => Promise<Croak | AuthorityError | InvalidArgumentsError>;
const postFile: PostFile = (rdb, actor) => async (filePath, thread) => {

  if (!filePath) {
    return null;
  }

  if (actor.status == CROAKER_STATUS_BANNED) {
    return new AuthorityError(actor.croaker_identifier, 'banned', 'ブロックされたユーザです');
  }

  if (!actor.form_agreement) {
    return new AuthorityError(actor.croaker_identifier, 'form_agreement', '投稿前にプロフィールの編集とお願いへの同意をしてください');
  }

  const actorAuthority = read(rdb, 'role', { role_name: actor.role_name });

  if (actorAuthority.post === POST_AUTHORITY_DISABLE) {
    return new AuthorityError(actor.croaker_identifier, 'post_disable', '投稿することはできません');
  }

  if (thread && thread < 1) {
    return new InvalidArgumentsError(actor.croaker_identifier, 'thread', thread, 'threadは1以上の整数です');
  }

  if (actorAuthority.post === POST_AUTHORITY_THREAD && !thread) {
    return new AuthorityError(actor.croaker_identifier, 'post_thread', 'スレッド上にのみ投稿することができます');
  }

  const lastCroak = getLastCroak(actor.user_id);
  const duration = getDuration(actorAuthority.top_post_interval);
  const croakTimePassed = !!compareAsc(add(lastCroak.posted_date, duration), new Date());

  if (actorAuthority.post === POST_AUTHORITY_TOP && !croakTimePassed) {
    const durationText = toStringDuration(duration);
    return new AuthorityError(actor.croaker_identifier, 'post_thread', `前回の投稿から${durationText}以上たってから投稿してください`);
  }

  if (!actorAuthority.post_file) {
    return new AuthorityError(actor.croaker_identifier, 'post_file', 'ファイルをアップロードすることはできません');
  }

  // TODO do something
  // file投稿するならfile pathがあってるかとか必要。事前にfile tabelがあるなら、primary keyの一致だけでいける

  return await create(rdb, 'croak', {
    user_id: actor.user_id;
    contents: contents,
    file_path: filePath,
    thread: thread,
  });
};

type DeleteCroak = (rdb: Kysely, actor: Actor) => (croakId: number) => Promise<Croak | AuthorityError>;
const deleteCroak: DeleteCroak = (rdb, actor) => async (croakId) => {

  if (actor.status == CROAKER_STATUS_BANNED) {
    return new AuthorityError(actor.croaker_identifier, 'banned', 'ブロックされたユーザです');
  }

  if (!actor.form_agreement) {
    return new AuthorityError(actor.croaker_identifier, 'form_agreement', '投稿前にプロフィールの編集とお願いへの同意をしてください');
  }

  const croak = read(rdb, 'croak', { croak_id: croakId });
  const actorAuthority = read(rdb, 'role', { role_name: actor.role_name });

  if (!croak.user_id === actor.user_id && !actorAuthority.delete_other_post) {
    return new AuthorityError(actor.croaker_identifier, 'delete_other_post', '自分以外の投稿を削除することはできません');
  }

  return await delete(rdb, 'croak', { croak_id: croakId });
};





import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

//Upload image to AWS S3
export async function POST(request: Request) {
  const { ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION, S3_BUCKET_NAME } =
    process.env;

  const s3Client = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: ACCESS_KEY_ID || "",
      secretAccessKey: SECRET_ACCESS_KEY || "",
    },
  });

  // URLからファイル名を取得
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get("filename");

  const formData = await request.formData();
  const file: any = formData.get("file");

  // File オブジェクトから Buffer に変換
  const buffer = Buffer.from(await file?.arrayBuffer());

  // アップロードパラメータの設定
  const uploadParams: any = {
    Bucket: S3_BUCKET_NAME,
    Key: fileName, //保存時の画像名
    Body: buffer, //input fileから取得
    ContentType: "image/png", // 適切なContentTypeを設定
    ACL: "public-read", // 公開読み取りアクセスを設定
  };

  try {
    //画像のアップロード
    const command = new PutObjectCommand(uploadParams);
    const uploadResult = await s3Client.send(command);
    console.log("Upload success:", uploadResult);
    const imageUrl = `https://${S3_BUCKET_NAME}.s3.${REGION}.amazonaws.com/${fileName}`;
    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json(err);
  }
}
