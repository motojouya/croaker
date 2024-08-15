import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { Inter as FontSans } from "next/font/google";
import "@/app/globals.css";
import { cn } from "@/lib/utils";
import { SessionProvider } from "@/app/SessionProvider";
import { Header } from "@/app/_components/Header";
import { bindContext } from "@/lib/base/context";
import { getIdentifier } from "@/lib/next/utility";
import { getMaster } from "@/case/getMaster";
import { auth } from "@/lib/next/nextAuthOptions";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Croaker",
  description: "Someone croaks here",
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
          <Suspense>
            <Header />
          </Suspense>
          <main className="w-screen min-h-screen flex flex-nowrap justify-center bg-white mt-12">
            <div className="w-full max-w-5xl">{children}</div>
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
