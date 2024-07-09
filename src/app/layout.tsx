import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Inter as FontSans } from "next/font/google";
import "@/app/globals.css";
import { cn } from "@/lib/utils";
import { SessionProvider } from "@/app/SessionProvider";
import { Header } from "@/app/_components/Header";
import { bindContext } from "@/lib/base/context";
import { getIdentifier } from "@/lib/next/routeHandler";
import { getMaster } from "@/case/getMaster";
import { auth } from "@/lib/next/nextAuthOptions";

const inter = Inter({ subsets: ["latin"] });

const master = {
  configuration: {
    title: 'Croaker',
    active: true,
    account_create_available: true,
    default_role_id: 1,
    about_contents: 'This is about.\nThis is contents.',
  },
  croaker: {
    type: "registered",
    value: {
      croaker_id: 'own6r',
      croaker_name: 'test_owner',
      description: 'I am test owner',
      status: 'ACTIVE',
      form_agreement: true,
      created_date: new Date(),
      updated_date: new Date(),
      role: {
        name: 'owner',
        ban_power: true,
        delete_other_post: true,
        post: 'TOP',
        post_file: true,
        top_post_interval: '',
        show_other_activities: true,
      }
    }
  },
} as const;

export const metadata: Metadata = {
  title: "Croaker",
  description: "Someone croaks here",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const session = await auth();
  // const identifier = getIdentifier(session);
  // const master = await bindContext(getMaster)(identifier)();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className)}>
        <SessionProvider master={master}>
          <Header/>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
