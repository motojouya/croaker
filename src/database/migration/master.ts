import { Kysely, sql } from "kysely";
import { Database } from "@/database/type";

const aboutContents = `
このwebサイトは、croakerというアプリケーションで動かしています。
croakerは、twitterで友達もできず、会社のslackのタイムラインでもなかなか絡んでもらえない寂しい中年のサラリーマンプログラマが作りました。

croakerは、ownerがセルフホストして運用コストを負担して動かすownerのためのタイムラインを作るアプリケーションです。
slackのtimesチャンネルの運用に近いが、publicであり、owner自身が強くコントロールできることを目的としています。
基本的にすべてはownerのものになるので、気に食わない投稿は削除でき、気に食わない人はbanできてしまいます。
slackで同僚のtimesチャンネルを荒らしたら迷惑ですよね？でも適度に話しかけられることを嫌がる人は少ないはずです。

こういった考え方で作られたものなので、利用者に公平であるために、visitor（あなたのことです）の情報は最低限です。
github、googleアカウントでログインでき、必要な情報は裏側で取得保持していますが、認証以外の機能では利用しません。
表示される情報で個人を特定可能になるものは基本的にないので、逆にわかりやすいように名前や説明を補足してほしいです。
ownerとの円滑なコミュニケーションのためにお願いします。

また、データについても基本的にownerに帰属します。
croakerの作者は、visitorの情報のうちgithub、googleから取得した情報の利用はしません。
投稿してもらった情報も外部に譲渡、公開することはしませんが、アプリケーションの改善やプログラマとしてのスキルアップのため、分析には利用させていただきます。
利用されるownerさんがいらっしゃるのであれば、このあたりの考えは宣言いただいて利用してほしいと考えています。

ごちゃごちゃと小難しい話が長いですが、最後まで読んでご理解いただき、ありがとうございます。
今後ともよろしくお願いします。
`.trim();

export async function up(db: Kysely<Database>): Promise<void> {
  await sql<void>`PRAGMA foreign_keys = true`.execute(db);

  await db.schema
    .createTable("configuration")
    .addColumn("title", "text", (col) => col.notNull()) // Croaker
    .addColumn("active", "boolean", (col) => col.notNull())
    .addColumn("account_create_available", "boolean", (col) => col.notNull())
    .addColumn("default_role_id", "integer", (col) => col.notNull())
    .addColumn("about_contents", "text", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("role")
    .addColumn("role_id", "integer", (col) => col.primaryKey())
    .addColumn("name", "text", (col) => col.notNull()) // owner visitor
    .addColumn("ban_power", "boolean", (col) => col.notNull())
    .addColumn("delete_other_post", "boolean", (col) => col.notNull())
    .addColumn("post", "text", (col) => col.notNull()) // top thread disable
    .addColumn("post_file", "boolean", (col) => col.notNull())
    .addColumn("top_post_interval", "integer", (col) => col.notNull())
    .addColumn("show_other_activities", "boolean", (col) => col.notNull())
    .execute();

  await db.insertInto("configuration").values({
    title: 'Croaker',
    active: true,
    account_create_available: true,
    default_role_id: 2,
    about_contents: aboutContents,
  }).execute();

  await db.insertInto("role").values([{
    role_id: 1,
    name: 'OWNER',
    ban_power: true,
    delete_other_post: true,
    post: 'TOP',
    post_file: true,
    top_post_interval: '0',
    show_other_activities: true,
  },{
    role_id: 2,
    name: 'VISITOR',
    ban_power: false,
    delete_other_post: false,
    post: 'TOP',
    post_file: false,
    top_post_interval: '0',
    show_other_activities: false,
  }]).execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await sql<void>`PRAGMA foreign_keys = false`.execute(db);
  await db.schema.dropTable("role").execute();
  await db.schema.dropTable("configuration").execute();
}
