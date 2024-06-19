import { FunctionResult, postFileCroak } from '@/case/croak/postFileCroak';
import { bindContext } from '@/lib/base/context';
import { FetchType, getFormHandler, executeFetch } from '@/lib/next/routeHandler';

export type ResponseType = FunctionResult;

const pathSchema = {
  type: 'object',
  properties: {
    croak_id: { type: 'string' }
  },
  required: ['croak_id'],
} as const satisfies JSONSchema;

export const POST = getFormHandler(
  pathSchema,
  null,
  'file',
  (p, f, file) => bindContext(postFileCroak)(file, p.croak_id)
);

export type FetchAPI = (thread: number, file: File) => Promise<ResponseType>;
export const fetchAPI: FetchAPI = async (thread, file) => {

  const formData = new FormData();
  formData.append("file", file, file.name);

  const result = await executeFetch(() => {
    return fetch(`/api/croak/${thread}/file`, {
      method: 'POST',
      body: formData,
    })
  });

  return result as ResponseType;
};
