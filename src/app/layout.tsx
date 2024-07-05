import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Inter as FontSans } from "next/font/google"
import "@/app/globals.css"
import { cn } from "@/lib/utils"
import { SessionProvider } from "@/app/SessionProvider"
import { bindContext } from '@/lib/base/context';
import { getIdentifier } from '@/lib/next/routeHandler';
import { getMaster } from '@/case/getMaster';
import { auth } from '@/lib/next/nextAuthOptions';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const session = await auth();
  const identifier = getIdentifier(session);
  const master = await bindContext(getMaster)(identifier)();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className)}>
        <SessionProvider master={master}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
