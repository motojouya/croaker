"use client"

import type { Croaker } from "@/database/query/croaker/croaker";
import type { CroakSimple } from "@/database/query/croakSimple/croakSimple";

import Link from 'next/link';
import { Profile } from "@/components/parts/Profile"

import { MainDiv } from "@/app/_components/MainDiv"
import { useMaster } from '@/app/SessionProvider';
import { buttonVariants } from "@/components/ui/button"
import { OthersActivities } from "@/app/setting/_components/OthersActivities"

export default function Page() {

  const master = useMaster();
  if (!master) {
    throw new Error('no configurations on session');
  }
  const { configuration, croaker } = master;

  let sessionCroaker: Croaker | null = null;
  if (croaker.type === "registered") {
    sessionCroaker = croaker.value;
  }

  return (
    <MainDiv>
      {!!sessionCroaker && (
        <Profile croaker={sessionCroaker}>
          <Link
            href={'/setting/edit'}
            className={buttonVariants({ variant: "destructive" })}
          >
            <p>Edit</p>
          </Link>
        </Profile>
      )}
      {!sessionCroaker && (
        <div className="w-full mt-5 flex flex-nowrap justify-center items-center">
          <Link
            href={'/auth/signin'}
            className={buttonVariants({ variant: "destructive" })}
          >
            <p>Login</p>
          </Link>
        </div>
      )}
      {!!sessionCroaker && sessionCroaker.role.show_other_activities && (
        <OthersActivities/>
      )}
      <div className="w-full mt-10 flex flex-nowrap justify-center items-center">
        <Link
          href={'/setting/about'}
          className={buttonVariants({ variant: "outline" })}
        >
          <p>About Croaker</p>
        </Link>
      </div>
    </MainDiv>
  );
}
