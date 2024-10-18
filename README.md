
# Croaker

## OVERVIEW
Twitterの代替アプリで、セルフホストして利用する。  

## HOW TO USE
cloud runを想定してdeployし、webから利用する。  

### DEPLOY
see [github actions](.github/workflows)

- build and push  
  docker imageのbuildとregistryへのpush  
- deploy  
  cloud runへのdeploy  
- migrate  
  migrationの実行  

### DEVELOPMENT
see
- [docker command](dc)
- [package.json](package.json)

### 準備
- sqlite3のデータベースファイルの用意  
- .envの用意  
  - STORAGE_BUCKET  
  - STORAGE_DIRECTORY  
  - NEXTAUTH_URL  
  - NEXTAUTH_SECRET  
  - GITHUB_ID  
  - GITHUB_SECRET  
  - GOOGLE_CLIENT_ID  
  - GOOGLE_CLIENT_SECRET  
  - githubとgoogleはどちらかあればログインできる  

## DIRECTORY
- app  
  next.jsのrouteファイル  
- case  
  サーバサイドのアプリケーションで特定の処理の単位でファイルが切られている  
- components  
  - ui  
    shadcn uiのcomponents  
  - parts  
    特定のpathで利用されるcompentsはappディレクトリ以下にあるが、共通で利用されるものはこちら  
- database  
  - migration  
    migrationファイル  
  - query  
    DBへのクエリ、また更新クエリも  
  - type  
    DB schemaをtypescriptで表現したもの  
- domain  
  共通で利用される機能群  
- lib  
  - base  
    アプリケーションの基礎機能で、例外、DI、スキーマ定義など  
  - io  
    アプリケーションの外部と連携を取るモジュール群  
  - next  
    next.jsでのコーディングを支援するモジュール  

## EndPoint
特定のurlとそこでアクセスしている裏側のエンドポイントや機能の一覧  

### Croak
メイン機能。つぶやき(croak)を投稿し、それらが流れるタイムラインを形成する。  

- `/`(top)
  - メイン画面
  - [無限スクロール](#無限スクロール)
  - `/api/croak/top` (API)
- `/search?text=[text]`
  - 検索画面
  - [無限スクロール](#無限スクロール)
  - `/api/croak/search` (API)
- `/thread/[croak_id]`
  - スレッド
  - [無限スクロール](#無限スクロール)
  - `/api/croak/thread` (API)
- `/croaker/[croaker_id]`
  - 投稿者(croaker)の画面
  - `case/croker/getCroaker` (RSC)
  - `case/croaker/banCroaker` (SA)

### setting
設定画面  

- `/setting`
  - 設定トップ
  - case/getMaster (RSC)
  - case/croaker/getRecentActivities (RSC)
- `/setting/edit`
  - 設定の編集
  - case/croaker/createCroaker (SA)
  - case/croaker/editCroaker (SA)
- `/setting/about`
  - Croakerについて
- `/api/auth`
  - 認証関連
  - Auth.js

## Next.js
選んだ意図としては最新のReactの機能にキャッチアップしたかったため。安定性ならRemix(react-router)にする。  

Next.jsには、サーバサイドのアプリケーションを支援する機能には乏しく、具体的にはDBアクセスやDIコンテナなどのモジュール管理を自分で構成する必要がある。  
Croakerでは、サーバサイドのコードは、フロントエンドと分離した状態を保つようにしている。  

以下の要素で構成される  
- React Client Component
- React Server Component(RSC)
- API Routes(API)
- Server Actions(SA)
- Case(サーバサイドの機能)

上記のうち、CaseのみがNext.jsに依存しないモジュールであり、これらが独立したモジュールであることを保っている。  
特にRSC,API,SAにおいては、Next.jsからCaseを呼び出すことになるため、つなぎ目で現れてくる機能を整理することが重要となる。  

以下のような機能が必要になるはず。他にもあるが、Croakerで意識しているのは以下となる。  
- session
- 認可
- DI
- ロギング
- リクエスト情報の取得
- リクエスト情報のバリデーション
- リクエスト情報の整理と引き渡し
- レスポンスの整理
- トランザクション管理

上記の機能を整理すると、以下のように分類でき、管理されている  

### Next.js側のハンドリング
以下のモジュールで実装され、各エンドポイントから利用されている  
- API  
  [src/lib/next/routeHandler.ts](src/lib/next/routeHandler.ts)  
- SA  
  [src/lib/next/serverActions.ts](src/lib/next/serverActions.ts)  

機能としては以下を実装している  
- session  
  [Auth.js](src/lib/next/nextAuthOptions.ts)  
- リクエスト情報の取得  
  query string, request body, form dataからのパラメータの取得  
- リクエスト情報のバリデーション  
  [Zod](src/lib/base/schema.ts)  
- レスポンスの整理  
  レスポンスをclassからjsonに変換し、status codeを操作するなど  

RSC上では上記のような便利関数は用意しておらず、そのまま使う。だいたい以下の感じ  
```ts
import { bindContext } from "@/lib/base/context";
import { getIdentifier } from "@/lib/next/utility";
import { getMaster } from "@/case/getMaster";
import { auth } from "@/lib/next/nextAuthOptions";

const session = await auth();
const identifier = getIdentifier(session);
const master = await bindContext(getMaster)(identifier)();
```

以下の便利関数を用意すべきだが、してない。  
便利関数があれば、RSCからAuth.jsへの依存も限定的にできる。 -> issueへ  
```ts
import { bindContext, GetContext, ContextFullFunction } from "@/lib/base/context";
import { getIdentifier } from "@/lib/next/utility";
import { auth } from "@/lib/next/nextAuthOptions";

function <T extends GetContext, F>handle(func: ContextFullFunction<T, (identifier: Identifier) => F>): F {
  const session = await auth();
  const identifier = getIdentifier(session);
  return bindContext(func)(identifier);
};
```

### サーバサイドアプリケーションの機能を利用
以下のモジュールで実装されている。  

- DI  
  [ContextBinder](src/lib/base/context.ts)  
  Case上で設定し、API,SA,RSC上から利用されるという構成になっている  
- 認可  
  [Authorization](src/domain/authorization/base.ts)  
  Case自身が知り、許可すべき内容なのでCaseのソースコードから利用される  
- トランザクション管理  
  [Database](src/database/base.ts)  
  トランザクションもCaseのソースコードから利用される。  

認可やトランザクションは、アプリケーションフレームワークがコンテナ上で処理することも多い概念だが、Croakerではそうなっておらず、プログラマが判断してCase上で利用される。  
認可についてはCase自身が知り、管理すべきという考えのため。  
コンテナで動くアプリケーションはDB以外のIOも比較して重くなりがちで、Caseの最初から最後までという統一的なトランザクション管理では荒すぎるため。  

### 未実装
以下は特にモジュールを用意していない  

- リクエスト情報の整理と引き渡し  
  API,SAの各実装で記載されているため、特に支援モジュールはない  
- ロギング  
  本当に未実装。やらなくてはならない。ContextBinderか、RouteHandlerでbindできると良い。  
- その他  
  その他が必要になった場合、Next側ならRouteHandlerに挟み、サーバサイドアプリケーションならContextBinderに挟むのが望ましい  

## Link
上記の説明中にあるリンクをまとめておく  

### Auth.js
認証、セッション管理はAuth.jsを利用。
Auth.jsはDBスキーマまで利用するモジュールで以下のの4つのテーブルを使っている
- User
- Account
- Session
- VerificationToken

これらのテーブルのカラムうち、User.idのみをアプリケーションで参照するため、sessionからもuser_idのみを取得し、Caseに引き渡す形を取っている。
また、Client Componentからはsessionにアクセスせず、RSCであるlayout.jsでuser_idを利用してアプリケーションの情報を取得し、React Contextを使ってClient Componentで参照する。

そのため、Auth.jsへの依存自体が、routeHandler.ts,serverActions.ts,RSCに閉じたものとして実現している。
Client ComponentやCaseからはAuth.jsを利用しない。してはいけない。
これは、DBスキーマを利用するという大胆な発想のモジュールの将来の影響を最小限にするためのもの。

認可処理はuser_idで紐づいたcroakerテーブルに認可情報へのリンクがあるため、Auth.jsでは認可にはまったく関与しない。
[Authorization](src/domain/authorization/base.ts)モジュールで実現される。
※ googleやgithubから見ればcroakerを認可する機能はAuth.jsに依存しているが、croaker内での認可の話。

### Zod
スキーマバリデータとしてZodを利用。
Client Component上でreact-hooks-formと連携して利用もしているが、本モジュールはサーバサイドでリクエストをバリデーションするためのもの。

ここで利用する定義は、typescriptで表現可能な型までとしている。
後続の処理からは、このバリデーション内容が見えないため、型で担保されている以上のバリデーションが意識されず、再度後続で実装する必要がある。
それであれば、型以上のバリデーションをする意味がないため。

### Context Binder

# 使い方
いわゆるDIコンテナを代替する機能。
1,2はCaseのそれぞれの名前空間で行い、3,4はCaseを利用するモジュール側で行う。

1. Caseそれぞれに、bindしたい依存関係を解決する設定(GetContext型)を定義する
2. setContextを使い、Caseのメイン関数(ContextFullFunction型)に1で定義した設定を組み込む
3. API RoutesやServer Actions上で、bindContextを使ってCaseの関数にDIを行って、実行関数を取得する
4. Case関数を実行する

# コンセプト
Caseの名前空間に依存の設定を記載する形になるので、依存性の解決というと違う感じもする。

状態を取り扱うライブラリはアプリケーション上で直接使うのではなく、[src/lib/io](src/lib/io)モジュールでwrapして使うルールとする。
そのため、それらのライブラリや状態をプラガブルに、疎結合に扱うことに関しては、IOモジュールに頼る形を取る。

上記の前提に立つため、基本的にはテストをモックしやすくすることを目的としており、コード上での疎結合性を完璧に実現するためのものではない。
Caseの名前空間に依存しているモジュールを記載するので、何を使っているか、一覧性は高いはず。

使用感の違いとしては、DIコンテナとは機能的にかなり違い、多重でDIを解決したりはしない。
依存する状態を組み合わせて実行するのはCase側の責任としている。

### 無限スクロール
see [/src/components/parts/croaks](/src/components/parts/croaks)

PlantUMLを用意してもいいかも
遷移や、apiアクセスのタイミング、画面の描画状態など、分かりづらいのでシーケンス図かなぁ。
あるいは、純粋にワイヤーフレームみたいな図が、時系列で遷移していく感じのほうがいいか。

### テキストについて
単一行テキストは、特になんの仕様もない
複数行テキストは、末尾のみtrimされ、先頭はtrimされない。
また、行頭が`https://`で始まり、空白文字列を含んでいない行はURLとみなす。
行全体をURLとしてみなすため、行中に空白文字列を含む場合はURLとしてみなさない。
URLとして見なす場合は、リンク先の情報を取得して表示する。

### 認可
domain/authorization

### エラー
lib/base/fail

### io
lib/io
基本的に分けて考えるがDataやRandom、consoleなど、どこでも呼べるようなものはioモジュールの中で、普通にそのまま呼んでる
caseの中ではDIして呼ばないといけないが、ioでは混ぜてる

### DB
database

