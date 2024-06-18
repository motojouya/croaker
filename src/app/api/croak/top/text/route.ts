import { FunctionResult, postTextCroak } from '@/case/croak/postTextCroak';
import { bindContext } from '@/lib/base/context';
import { FetchType, getBodyHandler, executeFetch } from '@/lib/next/routeHandler';

export type ResponseType = FunctionResult;

const bodySchema = {
  type: 'object',
  properties: {
    contents: { type: 'string' }
  },
  required: ['contents'],
} as const satisfies JSONSchema;

export const POST = getBodyHandler(
  null,
  bodySchema,
  (p, b) => bindContext(postTextCroak)(b.contents)
);

export type GetFetcher = (f: FetchType) => (contents: string) => Promise<ResponseType>;
export const getFetcher = (f) => async (contents) => {
  return executeFetch<ResponseType>(() => {
    return f(`/api/croak/top/text`, {
      method: 'POST',
      body: { contents },
    })
  });
};
