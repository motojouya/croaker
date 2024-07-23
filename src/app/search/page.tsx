"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { ResponseType } from "@/app/api/croak/search/route";
import { doFetch } from "@/lib/next/utility";
import { useMaster } from "@/app/SessionProvider";
import { GetCroaks } from "@/components/parts/croaks/loadingCroakList";
import { FooterLessCroakList } from "@/components/parts/croaks";

type SearchCroaks = (text: string) => GetCroaks;
const searchCroaks: SearchCroaks = (text) => async (offsetCursor, reverse) =>
  await doFetch<ResponseType>(`/api/croak/search?text=${text}reverse=${reverse}&offset_cursor=${offsetCursor || ""}`, {
    method: "GET",
  });

const Search: React.FC<{}> = () => {
  const searchParams = useSearchParams();
  const searchParamText = searchParams.get("text") || "";

  return <FooterLessCroakList getCroaks={searchCroaks(searchParamText)} />;
};

export default function Page() {
  return (
    <Suspense>
      <Search />
    </Suspense>
  );
}
