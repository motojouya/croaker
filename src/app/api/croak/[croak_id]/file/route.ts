import { FunctionResult, postFile } from '@/case/croak/postFileCroak';
import { bindContext } from '@/lib/base/context';
import { FetchType, getFormHandler, executeFetch } from '@/lib/next/routeHandler';
import { z } from 'zod';

export type ResponseType = FunctionResult;

const pathSchema = z.object({
  croak_id: z.coerce.number(),
});

export const POST = getFormHandler(
  pathSchema,
  null,
  'file',
  (identifier, p, f, file) => {
    if (!file) {
      throw new Error('file should be exist!');
    }
    return bindContext(postFile)(identifier)(file, p.croak_id);
  }
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
