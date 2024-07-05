import { FunctionResult, banCroaker } from "@/case/croaker/banCroaker";
import { bindContext } from "@/lib/base/context";
import { getRouteHandler } from "@/lib/next/routeHandler";
import { z } from "zod";
import { ResultJson } from "@/lib/base/fail";

export type ResponseType = ResultJson<FunctionResult>;

const pathSchema = z.object({
  croaker_id: z.string(),
});

export const POST = getRouteHandler(pathSchema, (identifier, p) => bindContext(banCroaker)(identifier)(p.croaker_id));

// import { FetchType, executeFetch } from '@/lib/next/routeHandler';
//
// export type FetchAPI = (croaker_id: string) => Promise<ResponseType>;
// export const fetchAPI: FetchAPI = async (croaker_id) => {
//   const result = await executeFetch(() => {
//     return fetch(`/api/croaker/${croaker_id}/ban`, {
//       method: 'POST',
//     })
//   });
//   return result as ResponseType;
// };
