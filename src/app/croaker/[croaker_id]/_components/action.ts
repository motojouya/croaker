"use server";

import { banCroaker } from "@/case/croaker/banCroaker";
import { bindContext } from "@/lib/base/context";
import { getServerAction } from "@/lib/next/serverActions";
import { z } from "zod";

const argsSchema = z.object({
  croaker_id: z.string(),
});

export const banCroakerAction = getServerAction(
  argsSchema,
  ({ croaker_id }) => `/croaker/${croaker_id}`,
  null,
  (identifier, p) => bindContext(banCroaker)(identifier)(p.croaker_id),
);
