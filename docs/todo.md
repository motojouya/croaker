
- [ ] google cloudの管理用のbucketとidentity poolを準備
- [ ] google cloud管理用リポジトリにcroaker管理用のリソースを作成
  - [ ] bucket
  - [ ] deploy service account
  - [ ] resource service account
- [ ] croakerのgoogle cloud resoruceの準備
  - [ ] bucket
  - [ ] cloud run service account
- [ ] deploy用github action
  - [ ] artifact registryへbuild&pushする(tag名はpackage.jsonのvesionを参照、trigger master push)
  - [ ] cloud runのdeploy terraform(var.versionを参照してpush、trigger dispatch)
- [ ] litestream
  - [ ] bucketに配置
  - [ ] litestreamへ連携するサイドカーコンテナ設定
- [ ] domain
  - [ ] とりあえずデフォルトドメインでdeploy
  - [ ] 今のドメインのサブドメインをコンソールから結びつけ
  - [ ] terraform化

