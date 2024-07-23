"use client";

import type { ResponseType } from "@/app/api/croak/[croak_id]/route";
import { useParams } from "next/navigation";
import { doFetch } from "@/lib/next/utility";
import { useMaster } from "@/app/SessionProvider";
import { GetCroaks } from "@/components/parts/croaks/loadingCroakList";
import { CroakList } from "@/components/parts/croaks";

type GetThreadCroaks = (thread: number) => GetCroaks;
const getThreadCroaks: GetThreadCroaks = (thread) => async (offsetCursor, reverse) =>
  await doFetch<ResponseType>(`/api/croak/${thread}?reverse=${reverse}&offset_cursor=${offsetCursor || ""}`, {
    method: "GET",
  });

export default function Page() {
  const { croak_id } = useParams<{ croak_id: string }>();
  const { croaker } = useMaster();

  const croakIdNumber = Number(croak_id);
  if (!Number.isSafeInteger(croakIdNumber) || croakIdNumber < 1) {
    return new Error(`threadは1以上の整数です ${croak_id}`);
  }

  return <CroakList croaker={croaker} thread={croakIdNumber} getCroaks={getThreadCroaks(croakIdNumber)} />;
}
