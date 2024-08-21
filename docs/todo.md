
## 動作確認
o croak/deleteCroak.ts
o croak/getCroaks.ts
o croak/postFileCroak.ts
o croak/postTextCroak.ts
o croaker/banCroaker.ts
o croaker/createCroaker.ts
o croaker/editCroaker.ts
o croaker/getCroaker.ts
o croaker/getRecentActivities.ts
o getMaster.ts
- みため調整margin使ってるのまずいかも
o メイン画面

## その後
  本番用docker image作成  
  dockerをcloud runにdeploy  
  github actionsでci cd自動化  
  sqliteをgcsに配置してlitestream実装  

## メモ
production buildは、dockerfile内でnpm run buildして、起動時にnpm run start
起動時にはsqliteを引っ張ってきてlitestreamも起動する

ローカルでビルドするのではなく、ci上でビルドしてcloud runにpushする感じになるはず。
なので、mainにmergeしたのをtriggerに本番deployという構造をとる

本番deployはregistoryにpushしたあとに、たぶんcloud run側で参照するdockerコンテナのversionの書き換えがありそう。
なければそれまでだが、registoryの何を参照するのか、そして実際にコンテナの入れ替え挙動はどうするかなどのパラメータがありそう。

