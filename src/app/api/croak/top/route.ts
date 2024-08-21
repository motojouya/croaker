import { FunctionResult, getTopCroaks } from "@/case/croak/getCroaks";
import { bindContext } from "@/lib/base/context";
import { getQueryHandler } from "@/lib/next/routeHandler";
import { z } from "zod";
import { ResultJson } from "@/lib/base/fail";

export type ResponseType = ResultJson<FunctionResult>;

const querySchema = z.object({
  reverse: z
    .string()
    .trim()
    .toLowerCase()
    .transform((str) => JSON.parse(str))
    .pipe(z.boolean().nullable()),
  offset_cursor: z.coerce.number().nullable(),
});

export const GET = getQueryHandler(null, querySchema, (identifier, p, q) =>
  bindContext(getTopCroaks)(identifier)(q.reverse || undefined, q.offset_cursor || undefined),
);
