
# production build

# Croaker

## OVERVIEW

## HOW TO USE
use from web

## DEPLOY
see [github actions](link)

## DEVELOPMENT
see dc for docker command.
see package.json for develop command.

本番イメージをローカルで動かす場合
TODO sqlite fileの配置の考慮がまだできてない
```shell
docker build -t croaker:develop --target production .
docker run -p 3000:3000 --env-file .env croaker:develop
```

## DIRECTORY
- app
- case
- components
  - ui
  - parts
- database
  - migration
  - query
  - type
- domain
- lib

## DESIGN
### croak

概要

- /
  top
  無限スクロール
  endpoint
  - 無限スクロールを参照
  - /api/croak/top
- /search?text=[text]
  search
  無限スクロール
  endpoint
  - 無限スクロールを参照
  - /api/croak/search
- /thread/[croak_id]
  thread
  無限スクロール
  endpoint
  - 無限スクロールを参照
  - /api/croak/thread
- /croaker/[croaker_id]
  croakに従属し、croakの説明にためにcroaker画面がある
  endpoint
  - case/croker/getCroaker
  - server actions
    - case/croaker/banCroaker

### setting

概要

- /setting
- /setting/edit
- /setting/about
- /api/auth

### 無限スクロール
see /src/components/parts/croaks

PlantUMLを用意してもいいかも
遷移や、apiアクセスのタイミング、画面の描画状態など、分かりづらいのでシーケンス図かなぁ。
あるいは、純粋にワイヤーフレームみたいな図が、時系列で遷移していく感じのほうがいいか。

### テキストについて
単一行テキストは、特になんの仕様もない
複数行テキストは、末尾のみtrimされ、先頭はtrimされない。
また、行頭が`https://`で始まり、空白文字列を含んでいない行はURLとみなす。
行全体をURLとしてみなすため、行中に空白文字列を含む場合はURLとしてみなさない。
URLとして見なす場合は、リンク先の情報を取得して表示する。

### session
/lib/next/nextAuthOptions.tsでnext-authを使っている。
内部的にはuser_idのみ、sessionから取れるようにしており、アプリケーションとしてもuser_idのみ利用。
しかも、user_idをアプリケーションに渡した後は、user_idからcroakerを引っ張り、その情報をreact server componentのlayout.tsxでトップレベルにバインドし、すべての画面で参照できるようにしている。
そのため、next-auth管理化の情報はクライアントには渡さない設計で、またnext-authのsession機能もクライアントからは利用しない。
認可もcroakerから引っ張る形なので、croakerを解決したらuser_idは利用しない設計となっている。
つまりアプリケーションの内部としては、徹底的にnext-authへの依存を排除し、接続部分でのみの利用に限定させている。

PlantUMLを用意してもいいかも
next-auth, application, userの3者で、画面やサーバーを図示しながら、アプリケーションでの情報のやり取りを可視化できるはず。

