
## API
sessionとdbをbindする関数は必要かも。それで隠蔽してやりたい。
route handlerは、そういうコンテナ的な役割をroute.tsに書きやすいが、server componentは書きづらいので、それを補助するイメージ
transactionの関数は、caseディレクトリ側に記載するし、用意があるので、大丈夫

### croaks
- getTopCroaks
  - /croak/top?offset=<number>
- searchCroaks
  - /croak/search/<text>?offset=<number>
- getThreadCroaks
  - /croak/thread/<number>?offset=<number>

DBから取得してきてreturn typeに変換する
```ts
type return = {
  croaks: Croak[];
  head_id: number;
  tail_id: number;
  count: number;
  has_next: bool;
};
```

- postCroak
  - post /croak/text
    - text
- postFile
  - post /croak/file
    - file
- deleteCroak
  - post /croak/delete/<croak_id>

ロジック書いてく

### croakers
更新は自分のページだけなので、更新に必要な情報はsessionで足りる。
更新のエンドポイントを通るときにsessionを更新すれば反映されるはずなので、取得も不要かな
ownerは、他のユーザのactivitiesを参照できるので、それを取得できる関数の用意は必要

自分以外のユーザ画面はserver componentsでやっちゃうのでエンドポイントは不要

- getCroaker
  - croaker identifier
- getRecentActivities
  - selfUserId
  - days

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

- changeSelfSetting
  - post /crocker/self
    - name
    - description
    - form_agreement
    - form_agreement=falseでも更新は成功するが、いつまでも投稿はできない

- func banCrocker
  - post /crocker/<identifier>/ban

### role & configuration
server components上で取得して、propsにわたす感じにする
react contextにいれちゃう

ただ、それらを取得する関数は必要なはず。両方一気に取得できる形でいいと思う。データ量多くないし
->普通にcaseに書いていく。でないと、actor(from session)をどう分解してdatabase accessにわたすかという知識を書く場所がないので

