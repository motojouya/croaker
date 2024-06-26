import { FunctionResult, postCroak } from '@/case/croak/postTextCroak';
import { bindContext } from '@/lib/base/context';
import { FetchType, getBodyHandler, executeFetch } from '@/lib/next/routeHandler';
import { z } from 'zod';

export type ResponseType = FunctionResult;

const bodySchema = z.object({
  contents: z.string(),
});

export const POST = getBodyHandler(
  null,
  bodySchema,
  (identifier, p, b) => bindContext(postCroak)(identifier)(b.contents)
);

export type FetchAPI = (contents: string) => Promise<ResponseType>;
export const fetchAPI: FetchAPI = async (contents) => {
  const result = await executeFetch(() => {
    return fetch(`/api/croak/top/text`, {
      method: 'POST',
      body: JSON.stringify({ contents }),
    })
  });
  return result as ResponseType;
};
