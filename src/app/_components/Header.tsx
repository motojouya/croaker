"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useMaster } from "@/app/SessionProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MagnifyingGlassIcon, GearIcon } from "@radix-ui/react-icons";

export const dynamic = "force-dynamic";

export type SetText = (text: string) => void;
export const Header: React.FC<{}> = () => {
  const searchParams = useSearchParams();
  const searchParamText = searchParams.get("text") || "";

  const router = useRouter();
  const { configuration, croaker } = useMaster();

  const [inputState, setInputState] = useState(false);
  const [searchText, setSearchText] = useState(searchParamText);

  const action = () => {
    if (!inputState) {
      setSearchText(searchParamText);
      setInputState(true);
      return;
    }

    if (!searchText) {
      setSearchText(searchParamText);
      setInputState(false);
      return;
    }

    router.push(`/search?text=${searchText}`);
  };

  return (
    <header className="fixed top-0 left-0 w-screen h-12 flex flex-nowrap justify-center items-center bg-white border-b">
      <div className="flex flex-nowrap justify-between items-center w-full max-w-5xl">
        <div className="grow-0 shrink-0 w-30 h-30 m-2">
          <Link href={"/"}>
            <Image src="/icon.png" width={30} height={30} alt="Croaker" />
          </Link>
        </div>
        {!inputState && (
          <div className="grow shrink m-2">
            <Link href={"/"}>
              <p>{configuration.title}</p>
            </Link>
          </div>
        )}
        {!!inputState && (
          <div className="grow shrink m-2">
            <Input
              type="text"
              placeholder="Search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        )}
        <div className="grow-0 shrink-0 m-2">
          <Button type="button" variant="link" size="icon" onClick={action}>
            <MagnifyingGlassIcon />
          </Button>
        </div>
        <div className="grow-0 shrink-0 m-2">
          <Link href={"/setting"} className="inline-block text-center w-8">
            <center>
              <GearIcon />
            </center>
          </Link>
        </div>
      </div>
    </header>
  );
};
