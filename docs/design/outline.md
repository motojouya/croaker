
# croaker

## システムの目的
一人でつぶやく場所がほしい。
ソーシャルなtwitterではつぶやきがはばかられる場面が増えてきた。
slackのUIのほうが楽だし見やすい
2ちゃんねる的なUIでもいいかもしれない。
マストドンのサーバをシングルユーザモードで運用するのとそんなにかわらないので、その点を考慮したい
マストドンのシングルユーザモードでは、だれも入ってこれない

## 機能概要
### ログイン
特にアカウント管理は面倒なので、githubアカウントでログインしたい。
入ってきたい人は入ってきてもいいので、それ用にgoogleアカウントでのログインも用意

### ユーザ情報管理
ユーザIDは勝手にふってしまう。
latin upper case + 数字で36文字を5桁だが、先頭と末尾は数字なしなので`26*36*36*36*26`

ユーザ名は勝手に変えることができる
bio欄も用意して、ユーザ管理画面上で、どちらも編集可能に

### つぶやき参照について
slackっぽいUIにしたい。
下に入力欄があり、submitすると下に追加していくイメージ。
入力者からはリアルタイムで追加されていく感じにしたいが、特に見る人もいないだろうしwebsocketとかでpush配信はしないので、他の人はリロード必要

検索はヘッダー欄に存在し、純粋に絞り込まれて表示されるイメージ。
これも下が最新

twitterは特定のツイートに対してコメントをつけてgraph上に広がる感じになるが、slackはスレ内から再度スレはきれない。
それでいいと思うので、そうする。
基本的なUIはトップレベルスレッドと同じ仕様

### ヘッダー
croakerボタン->トップ画面へのリンク
検索窓
settingボタン->自身のユーザ管理画面へ
aboutボタン->aboutへ

### フッター
ファイルアップロードボタン。画像のみ指定するやつは面倒だしui圧迫するので用意しない
入力窓。ここにデフォルトでフォーカスが当たるようにしたい
submitボタンは用意するが、ctrl+enterでsubmitしたい。enterは改行

### つぶやき
つぶやきは一つ一つに細いヘッダーが入るイメージ。ヘッダーなのかフッターなのかわからんくなるので、スペース開けるか、うっすいラインいれるかだけど、情報量が多いほうが好みなので、うっすいラインにしたい
つぶやきのヘッダは以下の感じ
`name`@`id` `time` `thread link` `link copy` `delete button`
`name`@`id`はリンクになっててユーザ管理画面に飛べるようにしたい
thread linkはスレに連なってればboldで目立つ感じにしておく

## 画面
### トップ
- ヘッダー
  - croaker
    - top link
  - 検索窓
  - setting link
  - about link
- つぶやき
  - 最新が下
  - つぶやき単体
    - ヘッダ
      - `name`@`id`
        - ユーザ管理画面リンク
      - `time`
      - `thread link`
        - スレがあればbold
      - `link copy`
      - `delete button`
- フッター
  - ファイルアップロード
  - 入力窓
    - enterで改行
    - ctrl + enterで島弧
    - 改行すると上下が広がっていく
  - submit button

スクロール時に一番したの投稿番号がハッシュとしてurlにつく
リンクとしてもハッシュつきのリンクはそこを起点として表示する

規約同意ができていない場合、投稿ができない

### 検索結果
検索結果なだけで、ほぼトップと一緒
urlに`?search=<text>`とつく

### スレッド
スレッドの情報なだけで、ほぼトップと一緒
urlに`/thread/<number>`とつく

### ユーザ管理画面
- ユーザ名
- ユーザid
- description
- 編集ボタン
  - ユーザ名とdescriptionだけが編集可能
  - submit
  - cancel
- ログアウト
- アカウント削除
- visitor activities
  - 直近1週間のvisitorの投稿まとめ
  - 通知の実装が面倒なので1週間で区切る
  - ユーザごとに行をまとめ、最新のものが上
  - クリックすると投稿に飛べるがそれも最新のみ。スレッド内であってもトップレベルに飛ばす。アンカーを利用
  - ownerにしか表示しない

初回の編集時にaboutの内容を表示し、`編集完了&同意`とキャンセルボタンを用意する。
ログインユーザの情報の話。他のユーザはユーザ詳細で確認する

### ユーザ詳細画面
基本的にはユーザ管理画面の内容で、編集やログインやらができず、activitiesも参照できない
あと追加でbanボタン
- banボタン
  - 管理者にのみ表示される

### about
- croakerの説明
```
このwebサイトは、croakerというアプリケーションで動かしています。
croakerは、twitterで友達もできず、会社のslackのタイムラインでもなかなか絡んでもらえない寂しい中年のサラリーマンプログラマが作りました。

croakerは、ownerがセルフホストして運用コストを負担して動かすownerのためのタイムラインを作るアプリケーションです。
slackのtimesチャンネルの運用に近いが、publicであり、owner自身が強くコントロールできることを目的としています。
基本的にすべてはownerのものになるので、気に食わない投稿は削除でき、気に食わない人はbanできてしまいます。
slackで同僚のtimesチャンネルを荒らしたら迷惑ですよね？でも適度に話しかけられることを嫌がる人は少ないはずです。

こういった考え方で作られたものなので、利用者に公平であるために、visitor（あなたのことです）の情報は最低限です。
github、googleアカウントでログインでき、必要な情報は裏側で取得保持していますが、ログイン以外の機能では利用しません。
唯一、[名前]だけは初期的にgithub、googleのものを設定しますが、それも変更可能です。
表示される情報で個人を特定可能になるものは基本的にないので、逆にわかりやすいように名前や説明を補足してほしいです。
ownerとの円滑なコミュニケーションのためにお願いします。

データについても基本的にownerに帰属します。
croakerの作者は、visitorの情報のうちgithub、googleから取得した情報の利用はしません。
投稿してもらった情報も外部に譲渡、公開することはしませんが、アプリケーションの改善やプログラマとしてのスキルアップのため、分析には利用させていただきます。
利用されるownerさんがいらっしゃるのであれば、このあたりの考えは宣言いただいて利用してほしいと考えています。

ごちゃごちゃと小難しい話が長いですが、最後まで読んでご理解いただき、ありがとうございます。
今後ともよろしくお願いします。
```

- ownerへのリンク

### ログイン画面
未ログイン時には、ユーザ管理画面リンクがログイン画面になる
next authを使うので基本的にはそっちで提供してくれる画面を利用する

## API
### croaks
/croak/top?offset=<number>
/croak/search/<text>?offset=<number>
/croak/thread/<number>?offset=<number>

```ts
type croak = {
  contents: string;
  file_path: string;
  croak_id: number;
  croaker_name: string;
  croaker_id: string;
  croak_time: Date;
  has_thread: bool;
  links: Link[];
};
type Link = {
  url: string;
  type: string;
  title?: string;
  image?: string;
  summary?: string;
};
type return = {
  croaks: Croak[];
  head_id: number;
  tail_id: number;
  count: number;
  has_next: bool;
};
```

- post /croak/text
  - text
- post /croak/file
  - file
- post /croak/delete/<croak_id>

### croakers
自分のはsessionに入れてしまう
```ts
type session = {
  user_id: string;
  name: string;
  email: string;
  email_verified: bool;
  croaker_id: string;
  croaker_name: string;
  croaker_description: string;
  croaker_status: string;
  croaker_role: string;
  form_agreement: bool;
};
```

他ユーザはserver componentsで値をいれてしまうので取得エンドポイントは不要

- post /crocker/<identifier>
  - name
  - description
  - form_agreement
  - form_agreement=falseでも更新は成功するが、いつまでも投稿はできない

- post /crocker/<identifier>/ban

### role & configuration
server components上で取得して、propsにわたす感じにする
react contextにいれちゃう

## RDB
### next auth table
- users
- accounts
- sessions

### other
- croaker
  - user_id
    - foreign
  - identifier
    - unique
  - name
  - description
  - status
    - active
    - banned
  - role_id
    - foreign
  - form_agreement
    - bool
  - created_date
  - update_date
- croak
  - user_id
    - foreign
  - croak_id
  - content
    - 140文字までにしたい
    - link含めてだとどうしても短くなっちゃうがlink情報だけ抜き出して保持しようとすると別テーブルが必要なので、要検討
  - file path
  - thread
    - not null
    - topレベルの場合は、自身のcroak_idが入る
  - posted_date
  - deleted_date
- role
  - role_id
  - name
    - owner
    - visitor
  - ban power
    - bool
  - delete other post
    - bool
    - 他のユーザのを消せるか。自分のはいつでも消せる
  - post
    - top level
    - only thread
    - disable
  - post files
    - bool
  - top post interval
    - トップレベルのpostの投稿間隔指定。これより短くはできない
    - 数字2桁+ymwdhmという単位で指定
  - show other activities
    - bool
    - ユーザ管理画面に他のユーザの行動まとめを表示するかどうか
- configuration
  - active
    - for mentainance
  - account create available
    - アカウントつくれなくする設定だがnext auth上でどうやればいいかわからんので保留
  - default_role_id
    - アカウント作る際に最初にアサインされるrole
  - about contents
- link
  - croak_id
  - url
  - type
    - content type (image ogp script など)
  - ogp_title
  - ogp_image
  - ogp_text
  - created_date

roleはowner,visitorの2レコード、configurationは1レコードをデフォルトでいれておきたい。
migrationでできるかな

linkテーブルは、サーバサイドでcontentsを解析してhttps始まりのリンクがあれば認識して保存する
url単位での重複は許されていて、基本はcroak_idとurlで一意になる。
キャッシュのために保存するが、あたらしいポストについては常に最新のOGPを取りに行くイメージ

### textについて
基本的にフリーテキストで改行もいれられる。
markdownのように修飾する機能は基本的にない。リッチに書きたければ、別途ブログ記事にすべき。

ただ、リンクぐらいは認識したい。
なるべく実装をさぼりたいので`https`スキームのみ認識する。twitterではスキームの前にスペースがあいていたり、行頭だと認識されるので、それと同等にする。
URLはマルチバイト文字も許されるはずなので、そこも許容したい。
画像、動画、OGPは取得して表示したい。コンテンツのサマリがでないとリンクがなんであるか、タイムラインから離れないとわからないのは不便なので。

一番、攻撃の隙になりやすい部分なのでセキュアになるように十分注意して実装したい。
難易度が高そうなので、リリース後の追加機能になるかも

## 技術要素
- sqlite + litestream
- next.js
- next-auth
  - github login
  - google login
- kysely
- sqliteとファイルデータのバックエンドとしてgcs
  - 署名付きURLの発行
- 実行環境はcloud run

## plans
1. docker、node、create-next-app、sqliteなどの環境整備
2. kyselyでのテーブル定義、基本的なDAO実装
3. route handlerの実装
4. front pageの実装
5. 全体調整

