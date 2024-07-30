
## 作業順序
1. ヘッダ done  
  - title  
  - 検索  
  - 設定リンク  
  - master参照があるが、固定データをlayout.tsxに入れて、静的な感じで作ってく  
    静的データはownerをシミュレーションしといたほうがいいよね  
2. ユーザ詳細画面 done  
  データは静的に用意する  
3. ユーザ設定画面  
  - 設定トップ画面 done  
    - ユーザ参照  
    - 最近の投稿  
    - 編集リンク、aboutリンク、ログインリンク  
  - ユーザ編集画面 doing  
  - about done  
4. 一覧画面 done  
  - 一覧 done  
    データは静的に用意する  
  - フッター（入力窓） done  
  - トップ done  
  - スレ done  
  - 検索 done  
  - 見た目の調整  
5. ログイン  
  - DBつなぎこみsqlite  
  - next-auth  
  - 各種認証情報取得
    - gcs
    - google auth
    - github auth
    - .envファイルへの配置
6. 動き  
  - 認証認可の画面側の実装とサーバ側の動き確認  
  - GCS設定してファイルアップロード  
7. 全体のデザイン調整  
  やりながらやるんだけど、それでも最後に調整はいる  

## その後
favicon作らねば done  
  カエルがニターっと笑ってる感じで黒い感じね  
twitterの過去ツイ取り込み用scriptの作成 これは面倒なのでやめる。  
  imageのuploadもできるようにしないとか  
  普通にcaseのpostTextCroakとpostFileCroakの流用が必要  
  実行scriptもプロダクトコードとして書いちゃうほうが楽そう。  
  そうなると、自分のアカウント作ったあとに、アプリ落として、実際のDBを参照したうえで、開発環境でスクリプト流してdbをlitestream同期する感じか  
  ファイルはローカルに取得して、fileDataを勝手に作れば、ローカルファイルを参照してuploadできるはず  
  スレも返信で表現できるので、大丈夫かな  
本番用docker image作成  
dockerをcloud runにdeploy  
github actionsでci cd自動化  
sqliteをgcsに配置してlitestream実装  

## その他
sqliteは、一旦ローカルを参照  
  ログイン情報とか残ってたほうが、google連携のために楽なので、dockerイメージと同時に消えないように  
image保存のgcsは、dev用のものを用意  
google連携、github連携は、テスト用のアプリアカウントを取得し、ドメインは開発サーバのものを利用  
  テストユーザアカウントは、今のメアドでいいかなぁ。ドメインが違うのでバッティングしないとは思うけど  
  今後のために、ログアウトはこまめにしたいが  
  うまくいかなければ、専用のテストアカウントをgoogle側で作って試す感じかな  
  githubアカウントは複数持てないので、基本はgoogleアカウントで行う  

