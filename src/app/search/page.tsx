'use client'

import { useSearchParams } from "next/navigation";
import type { ResponseType } from "@/app/api/croak/search/route";
import { doFetch } from "@/lib/next/utility";
import { useMaster } from "@/app/SessionProvider";
import { GetCroaks, UnPostableCroakList } from '@/components/parts/croaks'

type SearchCroaks = (text: string) => GetCroaks;
const searchCroaks: SearchCroaks = (text) => async (offsetCursor, reverse) => {
  const res = await doFetch(`/api/croak/search?text=${text}reverse=${reverse}&offset_cursor=${offsetCursor || ''}`, { method: "GET" });
  return res as ResponseType;
};

export default function Page() {

  const { croaker } = useMaster();

  const searchParams = useSearchParams();
  const searchParamText = searchParams.get("text") || "";

  return <UnPostableCroakList croaker={croaker} getCroaks={searchCroaks(searchParamText)} />;
}
