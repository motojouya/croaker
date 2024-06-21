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
  (identifier, p, b) => bindContext(postTextCroak)(identifier)(b.contents)
);

export type FetchAPI = (contents: string) => Promise<ResponseType>;
export const fetchAPI: FetchAPI = async (contents) => {
  const result = await executeFetch(() => {
    return fetch(`/api/croak/top/text`, {
      method: 'POST',
      body: { contents },
    })
  });
  return result as ResponseType;
};
