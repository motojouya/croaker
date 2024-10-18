import NextAuth, { DefaultSession } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { KyselyAdapter } from "@auth/kysely-adapter";
import { getKysely } from "@/database/kysely";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

/*
 * 認証、セッション管理はAuth.jsを利用。
 * Auth.jsはDBスキーマまで利用するモジュールで以下のの4つのテーブルを使っている
 * - User
 * - Account
 * - Session
 * - VerificationToken
 *
 * これらのテーブルのカラムうち、User.idのみをアプリケーションで参照するため、sessionからもuser_idのみを取得し、Caseに引き渡す形を取っている。
 * また、Client Componentからはsessionにアクセスせず、RSCであるlayout.jsでuser_idを利用してアプリケーションの情報を取得し、React Contextを使ってClient Componentで参照する。
 *
 * そのため、Auth.jsへの依存自体が、routeHandler.ts,serverActions.ts,RSCに閉じたものとして実現している。
 * Client ComponentやCaseからはAuth.jsを利用しない。してはいけない。
 * これは、DBスキーマを利用するという大胆な発想のモジュールの将来の影響を最小限にするためのもの。またClientComponentからは通信が発生するのでパフォーマンスも悪化する。
 * 更にuser_idはいくらかsensitiveな値なので、フロント側に渡したくない。
 *
 * 認可処理はuser_idで紐づいたcroakerテーブルに認可情報へのリンクがあるため、Auth.jsでは認可にはまったく関与しない。
 * [src/domain/authorization/base.ts](src/domain/authorization/base.ts)のAuthorizationモジュールで認可が実現される。
 * ※ googleやgithubから見ればcroakerを認可する機能はAuth.jsに依存しているが、croaker内での認可の話。
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  trustHost: true,
  session: { strategy: "database" }, // FIXME 'jwt' でもいい。いずれにしろadapterがあれば永続化はしてくれる。どっちがいいのか
  // @ts-ignore
  adapter: KyselyAdapter(getKysely()), // FIXME なんか型合わないが動かしてみて動けばいいでしょう
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: ({ session, user, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
        },
      };
    },
  },
});
