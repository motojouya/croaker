'use client';

import Link from 'next/link';
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useMaster } from '@/app/SessionProvider';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MagnifyingGlassIcon, GearIcon } from "@radix-ui/react-icons"
import { useSearch } from '@/app/_components/Search'

export const dynamic = 'force-dynamic';

export const Header: React.FC<{}> = () => {

  const searchParams = useSearchParams();
  const searchParamText = searchParams.get("text") || '';

  const master = useMaster();
  if (!master) {
    throw new Error('no configurations on session');
  }
  const { configuration, croaker } = master;

  const router = useRouter();

  const {
    inputState,
    searchText,
    setText,
    action,
  } = useSearch(searchParamText);

  return (
    <header className="fixed top-0 left-0 w-screen h-12 flex flex-nowrap justify-between items-center bg-white border-b">
      <div className="grow-0 shrink-0 w-30 h-30 m-2">
        <Link href={'/'}>
          <Image
            src="/icon.png"
            width={30}
            height={30}
            alt="Croaker"
          />
        </Link>
      </div>
      <div className="grow shrink m-2">
        <Link href={'/'}>
          {!inputState && (
            <p>{configuration.title}</p>
          )}
        </Link>
      </div>
      <div className="grow shrink m-2">
        {!!inputState && (
          <Input
            type="text"
            placeholder="Search"
            value={searchText}
            onChange={(e) => setText(e.target.value)}
          />
        )}
      </div>
      <div className="grow-0 shrink-0 m-2">
        <Button
          type="button"
          variant="link"
          size="icon"
          onClick={() => { action((searchText) => router.push(`/search?text=${searchText}`)) }}
        >
          <MagnifyingGlassIcon />
        </Button>
      </div>
      <div className="grow-0 shrink-0 m-2">
        <Link href={'/setting'} className="w-10 h-10">
          <GearIcon />
        </Link>
      </div>
    </header>
  );
};
