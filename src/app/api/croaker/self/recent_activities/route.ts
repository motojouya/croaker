import { FunctionResult, getRecentActivities } from '@/case/croaker/getRecentActivities';
import { bindContext } from '@/lib/base/context';
import { FetchType, getRouteHandler, executeFetch } from '@/lib/next/routeHandler';

export type ResponseType = FunctionResult;

export const GET = getRouteHandler(
  null,
  (identifier, p) => bindContext(getRecentActivities)(identifier)()
);

export type FetchAPI = () => Promise<ResponseType>;
export const fetchAPI: FetchAPI = async () => {
  const result = await executeFetch(() => {
    return fetch(`/api/croaker/self/recent_activities`);
  });
  return result as ResponseType;
};
