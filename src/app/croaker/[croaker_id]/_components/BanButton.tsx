"use client";

import { Button } from "@/components/ui/button";
import { ValueNoneIcon } from "@radix-ui/react-icons";
import { doFetch } from "@/lib/next/utility";
import { isRecordNotFound } from "@/database/fail";
import { isAuthorityFail } from "@/domain/authorization/base";
import { banCroakerAction } from '@/app/croaker/[croaker_id]/_components/action'

const ban = async (croaker_id: string) => {
  if (!confirm("本当にBANして大丈夫ですか？")) {
    return;
  }

  const result = banCroakerAction({ croaker_id });

  if (isAuthorityFail(result) || isRecordNotFound(result)) {
    alert(result.message);
    return;
  }

  // revalidateしているので多分不要
  // window.location.reload();
};

export const BanButton: React.FC<{
  croaker_id: string;
}> = ({ croaker_id }) => (
  <Button type="button" variant="destructive" className="h-7 w-7" size="icon" onClick={() => ban(croaker_id)}>
    <ValueNoneIcon />
  </Button>
);
