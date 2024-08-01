"use client";

import type { Croaker } from "@/database/query/croaker/croaker";
import type { CroakSimple } from "@/database/query/croakSimple/croakSimple";

import Link from "next/link";
import { Profile } from "@/components/parts/Profile";

import { useMaster } from "@/app/SessionProvider";
import { buttonVariants } from "@/components/ui/button";
import { OthersActivities } from "@/app/setting/_components/OthersActivities";

export default function Page() {
  const { configuration, croaker } = useMaster();
  return (
    <>
      {croaker.type === "anonymous" && (
        <div className="w-full mt-5 flex flex-nowrap justify-center items-center">
          <Link href={"/api/auth/signin"} className={buttonVariants({ variant: "procedure" })}>
            <p>Login</p>
          </Link>
        </div>
      )}
      {croaker.type === "logined" && (
        <div className="w-full mt-5 flex flex-nowrap justify-center items-center">
          <Link href={"/setting/edit"} className={buttonVariants({ variant: "procedure" })}>
            <p>Edit</p>
          </Link>
        </div>
      )}
      {croaker.type === "registered" && (
        <>
          <Profile croaker={croaker.value}>
            <Link href={"/setting/edit"} className={buttonVariants({ variant: "procedure" })}>
              <p>Edit</p>
            </Link>
          </Profile>
          {croaker.value.role.show_other_activities && <OthersActivities />}
        </>
      )}
      <div className="w-full mt-10 flex flex-nowrap justify-center items-center">
        <Link href={"/setting/about"} className={buttonVariants({ variant: "outline" })}>
          <p>About Croaker</p>
        </Link>
      </div>
    </>
  );
}
