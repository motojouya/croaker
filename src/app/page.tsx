'use client'

import type { ResponseType } from "@/app/api/croak/top/route";
import { doFetch } from "@/lib/next/utility";
import { useMaster } from "@/app/SessionProvider";
import { GetCroaks, PostableCroakList } from '@/components/parts/croaks'

type GetTopCroaks = () => GetCroaks;
const getTopCroaks: GetTopCroaks = () => async (offsetCursor, reverse) => {
  const res = await doFetch(`/api/croak/top?reverse=${reverse}&offset_cursor=${offsetCursor || ''}`, { method: "GET" });
  return res as ResponseType;
};

export default function Page() {
  const { croaker } = useMaster();
  return <PostableCroakList croaker={croaker} thread={null} getCroaks={getTopCroaks()} />;
}
