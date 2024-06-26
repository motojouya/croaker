import { FunctionResult, postCroak } from '@/case/croak/postTextCroak';
import { bindContext } from '@/lib/base/context';
import { FetchType, getBodyHandler, executeFetch } from '@/lib/next/routeHandler';
import { z } from 'zod';

export type ResponseType = FunctionResult;

const pathSchema = z.object({
  croak_id: z.coerce.number(),
});

const bodySchema = z.object({
  contents: z.string(),
});

export const POST = getBodyHandler(
  pathSchema,
  bodySchema,
  (identifier, p, b) => bindContext(postCroak)(identifier)(b.contents, p.croak_id)
);

export type FetchAPI = (thread: number, contents: string) => Promise<ResponseType>;
export const fetchAPI: FetchAPI = async (thread, contents) => {
  const result = await executeFetch(() => {
    return fetch(`/api/croak/${thread}/text`, {
      method: 'POST',
      body: JSON.stringify({ contents }),
    })
  });
  return result as ResponseType;
};
