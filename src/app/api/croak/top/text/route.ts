import { FunctionResult, postCroak } from "@/case/croak/postTextCroak";
import { bindContext } from "@/lib/base/context";
import { getBodyHandler } from "@/lib/next/routeHandler";
import { z } from "zod";
import { ResultJson } from "@/lib/base/fail";

export type ResponseType = ResultJson<FunctionResult>;

const bodySchema = z.object({
  contents: z.string(),
});

export const POST = getBodyHandler(null, bodySchema, (identifier, p, b) =>
  bindContext(postCroak)(identifier)(b.contents),
);

// import { FetchType, executeFetch } from '@/lib/next/routeHandler';
//
// export type FetchAPI = (contents: string) => Promise<ResponseType>;
// export const fetchAPI: FetchAPI = async (contents) => {
//   const result = await executeFetch(() => {
//     return fetch(`/api/croak/top/text`, {
//       method: 'POST',
//       body: JSON.stringify({ contents }),
//     })
//   });
//   return result as ResponseType;
// };
