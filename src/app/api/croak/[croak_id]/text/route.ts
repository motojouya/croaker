import { FunctionResult, postTextCroak } from '@/case/croak/postTextCroak';
import { bindContext } from '@/lib/base/context';
import { FetchType, getBodyHandler, executeFetch } from '@/lib/next/routeHandler';

export type ResponseType = FunctionResult;

const pathSchema = {
  type: 'object',
  properties: {
    croak_id: { type: 'string' }
  },
  required: ['croak_id'],
} as const satisfies JSONSchema;

const bodySchema = {
  type: 'object',
  properties: {
    contents: { type: 'string' }
  },
  required: ['contents'],
} as const satisfies JSONSchema;

export const POST = getBodyHandler(
  pathSchema,
  bodySchema,
  (p, b) => bindContext(postTextCroak)(b.contents, p.croak_id)
);

export type GetFetcher = (f: FetchType) => (thread: number, contents: string) => Promise<ResponseType>;
export const getFetcher = (f) => async (thread, contents) => {
  return executeFetch<ResponseType>(() => {
    return f(`/api/croak/${thread}/text`, {
      method: 'POST',
      body: { contents },
    })
  });
};
