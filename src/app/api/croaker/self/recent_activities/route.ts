import { FunctionResult, getRecentActivities } from "@/case/croaker/getRecentActivities";
import { bindContext } from "@/lib/base/context";
import { getRouteHandler } from "@/lib/next/routeHandler";
import { ResultJson } from "@/lib/base/fail";

export type ResponseType = ResultJson<FunctionResult>;

export const GET = getRouteHandler(null, (identifier, p) => bindContext(getRecentActivities)(identifier)());

// import { FetchType, executeFetch } from '@/lib/next/routeHandler';
//
// export type FetchAPI = () => Promise<ResponseType>;
// export const fetchAPI: FetchAPI = async () => {
//   const result = await executeFetch(() => {
//     return fetch(`/api/croaker/self/recent_activities`);
//   });
//   return result as ResponseType;
// };
