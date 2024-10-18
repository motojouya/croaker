
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
- [docker compose command](dc)
- [package.json#script](package.json)

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
  - Croakリスト [/src/components/parts/croaks/index.ts](/src/components/parts/croaks/index.ts)を利用
  - `/api/croak/top` (API)
- `/search?text=[text]`
  - 検索画面
  - Croakリスト [/src/components/parts/croaks/index.ts](/src/components/parts/croaks/index.ts)を利用
  - `/api/croak/search` (API)
- `/thread/[croak_id]`
  - スレッド
  - Croakリスト [/src/components/parts/croaks/index.ts](/src/components/parts/croaks/index.ts)を利用
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
  [src/lib/next/nextAuthOptions.ts](src/lib/next/nextAuthOptions.ts)からAuth.jsを使用  
- リクエスト情報の取得  
  query string, request body, form dataからのパラメータの取得  
- リクエスト情報のバリデーション  
  [src/lib/base/schema.ts](src/lib/base/schema.ts)からZodを使用  
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

FIXME 本当はRSCでも便利関数を用意してAuth.jsへの依存を減らすべき

### サーバサイドアプリケーションの機能を利用
以下のモジュールで実装されている。  

- DI  
  ContextBinder [src/lib/base/context.ts](src/lib/base/context.ts)  
  Case上で設定し、API,SA,RSC上から利用されるという構成になっている  
- 認可  
  Authorization [src/domain/authorization/base.ts](src/domain/authorization/base.ts)  
  Case自身が知り、許可すべき内容なのでCaseのソースコードから利用される  
- トランザクション管理  
  Database [src/database/base.ts](src/database/base.ts)  
  トランザクションもCaseのソースコードから利用される。  

認可やトランザクションは、アプリケーションフレームワークがコンテナ上で処理することも多い概念だが、Croakerではそうなっておらず、プログラマが判断してCase上で利用される。  
認可についてはCase自身が知り、管理すべきという考えのため。  
コンテナで動くアプリケーションはDB以外のIOも比較して重くなりがちで、Caseの最初から最後までという統一的なトランザクション管理では粗すぎるため。  

### 実装していないもの
以下は特にモジュールを用意していない  

- リクエスト情報の整理と引き渡し  
  API,SAの各実装で記載されているため、特に支援モジュールはない  
- ロギング  
  FIXME 本当に未実装。やらなくてはならない。ContextBinderか、RouteHandlerでbindできると良い。  
- その他  
  その他が必要になった場合、Next側ならRouteHandlerに挟み、サーバサイドアプリケーションならContextBinderに挟むのが望ましい  

## その他
IOに限らないが、ライブラリはwrapして利用し、切り替えやすい形としておく。  
特にアプリケーションの外に出るIOモジュールのものは必須。  

Date,Random,Consoleなど、比較的どの場面でも利用するIOなモジュールについては、主なIO処理と合わせてIOモジュール内は特にDIなどせず呼び出す。  
ただし、Caseからは直接利用してはいけない。  

## Link
- Session,認証  
  [src/lib/next/nextAuthOptions.ts](src/lib/next/nextAuthOptions.ts)  
- Schema Validator  
  [src/lib/base/schema.ts](src/lib/base/schema.ts)  
- Context Binder(DI代替)  
  [src/lib/base/context.ts](src/lib/base/context.ts)  
- CroakリストUI  
  [/src/components/parts/croaks/index.ts](/src/components/parts/croaks/index.ts)  
- テキストについて  
  [src/domain/croak/croak.ts](src/domain/croak/croak.ts)  
- 認可  
  [src/domain/authorization/base.ts](src/domain/authorization/base.ts)  
- エラー  
  [src/lib/base/fail.ts](src/lib/base/fail.ts)  
- DB  
  [src/database/base.ts](src/database/base.ts)  

