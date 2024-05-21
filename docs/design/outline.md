
# croaker

## システムの目的
一人でつぶやく場所がほしい。
ソーシャルなtwitterではつぶやきがはばかられる場面が増えてきた。
slackのUIのほうが楽だし見やすい
2ちゃんねる的なUIでもいいかもしれない。
マストドンのサーバをシングルユーザモードで運用するのとそんなにかわらないので、その点を考慮したい

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

### 検索結果
検索結果なだけで、ほぼトップと一緒
urlに`?search=<text>`とつく

### スレッド
検索結果なだけで、ほぼトップと一緒
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
- banボタン
  - 管理者にのみ表示される

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
};
type return = {
  croaks: Croak[];
  head_id: number;
  tail_id: number;
  count: number;
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
};
```

他ユーザはserver componentsで値をいれてしまうので取得エンドポイントは不要

- post /crocker/<identifier>
  - name
  - description

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
  - created_date
  - update_date
- croak
  - user_id
    - foreign
  - croak_id
  - content
  - file path
  - thread
    - null
    - croak_id
  - posted_date
  - deleted_date
- role
  - role_id
  - name
    - admin
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
- configuration
  - active
    - for mentainance
  - account create available
    - アカウントつくれなくする設定だがnext auth上でどうやればいいかわからんので保留
  - default_role_id
    - アカウント作る際に最初にアサインされるrole


about pageは必要。ヘッダーを圧迫しちゃうけど、リンク追加する。dbにもcolumn用意
ユーザー情報の編集フラグも用意して、一度も編集してないとポストできなくしておく。
roleにtop post intervalを用意して、topへのポストを連続でできなくする機能は欲しい。column定義は/{\d}2(y,m,w,d,h,m)+/な感じ。数字は2桁固定で、単位を指定する。
やっぱ文字数制限はあったほうがいいかも。twitterリスペクトで140文字かな。
