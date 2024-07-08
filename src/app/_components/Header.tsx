'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMaster } from '@/app/SessionProvider';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MagnifyingGlassIcon, GearIcon } from "@radix-ui/react-icons"
import { useSearch, Search } from '@/app/_components/Search'

export const dynamic = 'force-dynamic';

export const Header: React.FC<{ searchTextInput: string }> = ({ searchTextInput }) => {

  const master = useMaster();
  if (!master) {
    throw new Error('no configurations on session');
  }
  const { configuration, croaker } = master;

  const router = useRouter();

  const {
    inputState,
    setText: setSearchText,
    action,
  } = useSearch(searchTextInput);

  return (
    <header className="sticky flex justify-between px-8 w-screen h-16 bg-teal-400 items-center drop-shadow-2xl border-b border-gray-300 shadow-md">
      <h1 className="font-bold text-2xl">
        <Link href={'/'}>
          <p>C{/* TODO favicon */}</p>
          {!inputState && (
            <p>{configuration.title}</p>
          )}
        </Link>
      </h1>
      <div className="flex gap-3">
        <Search
          inputState={inputState}
          setText={setText}
          action={() => {action((searchText) => router.push(`/search?text=${searchText}`))}}
        />
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
