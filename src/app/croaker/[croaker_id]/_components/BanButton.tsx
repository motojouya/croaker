"use client";

import { Button } from "@/components/ui/button";
import { ValueNoneIcon } from "@radix-ui/react-icons";
import { doFetch } from "@/lib/next/utility";
import { ResponseType } from "@/app/api/croaker/[croaker_id]/ban/route";
import { isRecordNotFound } from "@/database/fail";
import { isAuthorityFail } from "@/domain/authorization/base";

const ban = async (croaker_id: string) => {
  if (!confirm("本当にBANして大丈夫ですか？")) {
    return;
  }

  const result = await doFetch<ResponseType>(`/api/croaker/${croaker_id}/ban`, { method: "POST" });

  if (isAuthorityFail(result) || isRecordNotFound(result)) {
    alert(result.message);
    return;
  }

  window.location.reload();
};

export const BanButton: React.FC<{
  croaker_id: string;
}> = ({ croaker_id }) => (
  <Button type="button" variant="destructive" className="h-7 w-7" size="icon" onClick={() => ban(croaker_id)}>
    <ValueNoneIcon />
  </Button>
);
