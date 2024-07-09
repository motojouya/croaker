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
    setText,
    action,
  } = useSearch(searchParamText);

  return (
    <header className="sticky flex justify-between px-8 w-screen h-16 bg-white-400 items-center border-b border-gray-300">
      <h1 className="flex gap-3">
        <Link href={'/'} className="flex">
          <Image
            src="/icon.png"
            width={30}
            height={30}
            alt="Croaker"
          />
          {!inputState && (
            <p>{configuration.title}</p>
          )}
        </Link>
      </h1>
      <div className="flex gap-3">
        {!!inputState && (
          <Input type="text" placeholder="Search" onChange={(e) => setText(e.target.value)}/>
        )}
        <Button
          type="submit"
          variant="outline"
          size="icon"
          onClick={() => { action((searchText) => router.push(`/search?text=${searchText}`)) }}
        >
          <MagnifyingGlassIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex gap-3">
        <Link href={'/setting'}>
          <div className="w-100 h-20 flex items-center">
            <GearIcon />
          </div>
        </Link>
      </div>
    </header>
  );
};
