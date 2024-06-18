import { FunctionResult, getRecentActivities } from '@/case/croaker/getRecentActivities';
import { bindContext } from '@/lib/base/context';
import { FetchType, getRouteHandler, executeFetch } from '@/lib/next/routeHandler';

export type ResponseType = FunctionResult;

export const GET = getRouteHandler(
  null,
  (p) => bindContext(getRecentActivities)()
);

export type GetFetcher = (f: FetchType) => (reverse: boolean, offsetCursor?: number) => Promise<ResponseType>;
export const getFetcher = (f) => async (reverse, offsetCursor) => {
  return executeFetch<ResponseType>(() => {
    return f(`/api/croaker/self/recent_activities`);
  });
};
