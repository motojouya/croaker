import { FunctionResult, getThreadCroaks } from "@/case/croak/getCroaks";
import { bindContext } from "@/lib/base/context";
import { getQueryHandler } from "@/lib/next/routeHandler";
import { z } from "zod";
import { ResultJson } from "@/lib/base/fail";

export type ResponseType = ResultJson<FunctionResult>;

const pathSchema = z.object({
  croak_id: z.coerce.number(),
});

const querySchema = z.object({
  reverse: z.coerce.boolean().nullable(),
  offset_cursor: z.coerce.number().nullable(),
});

export const GET = getQueryHandler(pathSchema, querySchema, (identifier, p, q) =>
  bindContext(getThreadCroaks)(identifier)(p.croak_id, q.reverse || undefined, q.offset_cursor || undefined),
);
