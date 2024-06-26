import { FunctionResult, postFile } from '@/case/croak/postFileCroak';
import { bindContext } from '@/lib/base/context';
import { FetchType, getFormHandler, executeFetch } from '@/lib/next/routeHandler';
import { z } from 'zod';

export type ResponseType = FunctionResult;

export const POST = getFormHandler(
  null,
  null,
  'file',
  (identifier, p, f, file) => bindContext(postFile)(identifier)(file)
);

export type FetchAPI = (file: File) => Promise<ResponseType>;
export const fetchAPI: FetchAPI = async (file) => {

  const formData = new FormData();
  formData.append("file", file, file.name);

  const result = await executeFetch(() => {
    return fetch(`/api/croak/top/file`, {
      method: 'POST',
      body: formData,
    })
  });

  return result as ResponseType;
};
