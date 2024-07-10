"use client"

import type { Croaker } from "@/database/query/croaker/croaker";

import Link from 'next/link';
import { Profile } from "@/components/parts/Profile"

import { MainDiv } from "@/app/_components/MainDiv"
import { useMaster } from '@/app/SessionProvider';
import { buttonVariants } from "@/components/ui/button"
import { AboutCroaker } from '@/components/parts/AboutCroaker'
import { MultiLineText } from '@/components/parts/MultiLineText'

import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MagnifyingGlassIcon, GearIcon } from "@radix-ui/react-icons"
import { useSearch } from '@/app/_components/Search'

import { Textarea } from "@/components/ui/textarea"

import { Checkbox } from "@/components/ui/checkbox"

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
      {!sessionCroaker && (
        <div>
          New!
        </div>
      )}
      {!!sessionCroaker && (
        <>
          <div className="w-full mt-2 flex flex-nowrap justify-start items-center">
            <p className="mx-2 text-2xl">{sessionCroaker.croaker_name}</p>
          </div>
          <div className="w-full flex flex-nowrap justify-start items-center">
            <p className="mx-2">{`@${sessionCroaker.croaker_id}`}</p>
          </div>
          <div className="w-full mt-5 flex flex-nowrap justify-start items-center">
            <p className="mx-2"><MultiLineText text={sessionCroaker.description}/></p>
          </div>
          <AboutCroaker aboutContents={configuration.about_contents} />
        </>
      )}
      <div className="grow shrink m-2">
        <Input
          type="text"
          placeholder="Search"
          value={''}
          onChange={(e) => console.log(e.target.value)}
        />
      </div>
      <Textarea placeholder="Type your message here." />
      <div className="items-top flex space-x-2">
        <Checkbox id="terms1" />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="terms1"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Accept terms and conditions
          </label>
          <p className="text-sm text-muted-foreground">
            You agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
      <div className="grow-0 shrink-0 m-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => console.log('click!')}
        >
          <p>Submit</p>
        </Button>
      </div>
    </MainDiv>
  );
}
