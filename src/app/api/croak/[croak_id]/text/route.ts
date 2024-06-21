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
  (identifier, p, b) => bindContext(postTextCroak)(identifier)(b.contents, p.croak_id)
);

export type FetchAPI = (thread: number, contents: string) => Promise<ResponseType>;
export const fetchAPI: FetchAPI = async (thread, contents) => {
  const result = await executeFetch(() => {
    return fetch(`/api/croak/${thread}/text`, {
      method: 'POST',
      body: { contents },
    })
  });
  return result as ResponseType;
};
