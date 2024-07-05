import { FunctionResult, postCroak } from "@/case/croak/postTextCroak";
import { bindContext } from "@/lib/base/context";
import { getBodyHandler } from "@/lib/next/routeHandler";
import { z } from "zod";
import { ResultJson } from "@/lib/base/fail";

export type ResponseType = ResultJson<FunctionResult>;

const pathSchema = z.object({
  croak_id: z.coerce.number(),
});

const bodySchema = z.object({
  contents: z.string(),
});

export const POST = getBodyHandler(pathSchema, bodySchema, (identifier, p, b) =>
  bindContext(postCroak)(identifier)(b.contents, p.croak_id),
);

// import { FetchType, executeFetch } from '@/lib/next/routeHandler';
//
// export type FetchAPI = (thread: number, contents: string) => Promise<ResponseType>;
// export const fetchAPI: FetchAPI = async (thread, contents) => {
//   const result = await executeFetch(() => {
//     return fetch(`/api/croak/${thread}/text`, {
//       method: 'POST',
//       body: JSON.stringify({ contents }),
//     })
//   });
//   return result as ResponseType;
// };
