import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { DefaultSession } from 'next-auth';
import NextAuth from "next-auth"
import { KyselyAdapter } from "@auth/kysely-adapter";
import { nextAuthKysely } from "@/database/base";
// import { FunctionResult, createCroaker } from '@/case/croaker/createCroaker';
// import { bindContext } from '@/lib/base/context';

/*
 * 設計方針として、next-authはclientサイドで参照しない
 * 考え方として、next-auth自体が仕様の塊であり、仕様の変更を強く受けてしまいそうな部分であるため
 * したがって、sessionにアクセスするのは常にサーバサイドであり、サーバサイドで取得したsession情報をlayout.tsxにbindすることでアクセスできるようにする
 * これは、clientサイドでuseSession、getSessionしてしまうと、通信が発生しパフォーマンスが悪化するという事情もある
 * ユーザを特定するためのkeyは`user.id = user_id`になるが、この値はいくらかsensitiveなので、これもclientには渡さないように注意する
 * ただ、必要なので、sessionから取れるようにはしておく。
 *
 * ユーザの状態としては、未ログイン -> ログイン -> croaker登録済みという段階で遷移するので、これを意識してコードを書く
 */
// TODO こういう感じかな
// anonymousとsignedは、oauth上は意味があるけど、アプリケーションは基本的に同一のものとして扱いたい。
// clientサイドでは、ユーザビリティのために制御が走るけど、サーバサイドではは完全に意識しない感じ。
import type { Croaker } from 'TODO any';
import type { Configuration } from 'TODO any';
type User = 
  | { type: 'anonymous' }
  | { type: 'signed' }
  | { type: 'registerd' } & Croaker;
type ClientSession = {
  user: User;
  config: Configuration
};

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

export const options: NextAuthOptions = {
  debug: true,
  session: { strategy: "jwt" }, // TODO 'database' でもいい。いずれにしろadapterがあれば永続化はしてくれる。どっちがいいのか
  adapter: KyselyAdapter(nextAuthKysely),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }),
    // CredentialsProvider({
    //   name: "Sign in",
    //   credentials: {
    //     email: {
    //       label: "Email",
    //       type: "email",
    //       placeholder: "example@example.com",
    //     },
    //     password: {label: "Password", type: "password"},
    //   },
    //   // メルアド認証処理
    //   async authorize(credentials) {
    //     const users = [
    //       {id: "1", email: "user1@example.com", password: "password1"},
    //       {id: "2", email: "user2@example.com", password: "password2"},
    //       {id: "3", email: "abc@abc", password: "123"},
    //     ];

    //     const user = users.find(user => user.email === credentials?.email);

    //     if (user && user?.password === credentials?.password) {
    //       return {id: user.id, name: user.email, email: user.email, role: "admin"};
    //     } else {
    //       return null;
    //     }
    //   }
    // }),
  ],
  callbacks: {
    signIn: async ({ user }) => {
      // TODO 登録時にcroakerを入れてやりたいが、これでいいのか
      // できないなら、初回のeditCroakerの際に登録までしてしまう。
      // その際、user_id、nameはsessionから取れるので、それを使う形
      // 画面にもnameは出るので、croakerがなくても、layout.tsxにsessionから取れるnameだけはbindする。user_idは画面には不要
      //
      // 仕様に振り回されるのも嫌なので、editCroakerでやってしまう。
      // あるいは初回のprof変更時にエンドポイント作って振り分けてcreateCroakerを使う形でもいい。
      // で、profの初期状態でnameは空欄にしておく。
      // await bindContext(createCroaker)(user.id, user.name);
    },
    jwt: async ({token, user, account, profile, isNewUser}) => {
      // 注意: トークンをログ出力してはダメです。
      console.log('in jwt', {user, token, account, profile})

      if (user) {
        token.user = user;
        const u = user as any
        token.role = u.role;
      }
      if (account) {
        token.accessToken = account.access_token
      }
      return token;
    },
    session: ({ session, user, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
        },
      }
      // console.log("in session", { session, token });
      // token.accessToken
      // return {
      //   ...session,
      //   user: {
      //     ...session.user,
      //     role: token.role,
      //   },
      // };
    },
  }
};
