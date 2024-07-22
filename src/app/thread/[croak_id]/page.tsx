'use client'

import type { ResponseType } from "@/app/api/croak/[croak_id]/route";
import { doFetch } from "@/lib/next/utility";
import { useMaster } from "@/app/SessionProvider";
import { GetCroaks, PostableCroakList } from '@/components/parts/croaks'

type GetThreadCroaks = (thread: number) => GetCroaks;
const getThreadCroaks: GetThreadCroaks = (thread) => async (offsetCursor, reverse) => {
  const res = await doFetch(`/api/croak/${thread}?reverse=${reverse}&offset_cursor=${offsetCursor || ''}`, { method: "GET" });
  return res as ResponseType;
};

type PageArgs = {
  params: {
    croak_id: number
  }
};

export default function Page(args: PageArgs) {
  const { croaker } = useMaster();
  return <PostableCroakList croaker={croaker} thread={null} getCroaks={getThreadCroaks(args.params.croak_id)} />;
}
