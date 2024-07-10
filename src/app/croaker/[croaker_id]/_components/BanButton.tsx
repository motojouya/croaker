"use client"

import { Button } from "@/components/ui/button"
import { ValueNoneIcon } from "@radix-ui/react-icons"
import { doFetch } from '@/lib/next/routeHandler';
import { ResponseType } from '@/app/api/croaker/[croaker_id]/ban/route';
import { RecordNotFoundFail, isRecordNotFound } from "@/database/base";
import { AuthorityFail, isAuthorityFail } from "@/domain/authorization/base";

const ban = async (croaker_id: string) => {

  if (!confirm('本当にBANして大丈夫ですか？')) {
    return;
  }

  const res = await doFetch(`/api/croaker/${croaker_id}/ban`, { method: 'POST' });
  const result = res as ResponseType;

  if (isAuthorityFail(result)) {
    alert('権限がありません');
    return;
  }

  if (isRecordNotFound(result)) {
    alert('既にBANされたユーザです');
    return;
  }

  window.location.reload();
};

type ParamType = { croaker_id: string };

export function BanButton({ croaker_id }: ParamType) {
  return (
    <Button
      type="button"
      variant="destructive"
      className="h-7 w-7"
      size="icon"
      onClick={() => ban(croaker_id)}
    >
      <ValueNoneIcon />
    </Button>
  );
} 
