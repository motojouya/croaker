import NextAuth, { DefaultSession } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
// import CredentialsProvider from "next-auth/providers/credentials";
import { KyselyAdapter } from "@auth/kysely-adapter";
import { getKysely } from "@/database/kysely";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  session: { strategy: "database" }, // TODO 'jwt' でもいい。いずれにしろadapterがあれば永続化はしてくれる。どっちがいいのか
  // @ts-ignore
  adapter: KyselyAdapter(getKysely()), // TODO なんか型合わないが動かしてみて動けばいいでしょう
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
    // jwt: async ({token, user, account, profile, isNewUser}) => {
    //   // 注意: トークンをログ出力してはダメです。
    //   console.log('in jwt', {user, token, account, profile})

    //   if (user) {
    //     token.user = user;
    //     const u = user as any
    //     token.role = u.role;
    //   }
    //   if (account) {
    //     token.accessToken = account.access_token
    //   }
    //   return token;
    // },
    session: ({ session, user, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
        },
      };
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
  },
});
