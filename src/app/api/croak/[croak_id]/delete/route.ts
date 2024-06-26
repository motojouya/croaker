import { FunctionResult, deleteCroak } from '@/case/croak/deleteCroak';
import { bindContext } from '@/lib/base/context';
import { FetchType, getRouteHandler, executeFetch } from '@/lib/next/routeHandler';
import { z } from 'zod';

export type ResponseType = FunctionResult;

const pathSchema = z.object({
  croak_id: z.coerce.number(),
});

export const POST = getRouteHandler(
  pathSchema,
  (identifier, p) => bindContext(deleteCroak)(identifier)(p.croak_id)
);

export type FetchAPI = (thread: number) => Promise<ResponseType>;
export const fetchAPI: FetchAPI = async (thread) => {
  const result = await executeFetch(() => {
    return fetch(`/api/croak/${thread}/delete`, {
      method: 'POST',
    })
  });
  return result as ResponseType;
};
