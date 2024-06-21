import { FunctionResult, postFileCroak } from '@/case/croak/postFileCroak';
import { bindContext } from '@/lib/base/context';
import { FetchType, getFormHandler, executeFetch } from '@/lib/next/routeHandler';

export type ResponseType = FunctionResult;

export const POST = getFormHandler(
  null,
  null,
  'file',
  (identifier, p, f, file) => bindContext(postFileCroak)(identifier)(file)
);

export type FetchAPI = (file: File) => Promise<ResponseType>;
export const fetchAPI: FetchAPI = async (file) => {

  const formData = new FormData();
  formData.append("file", file, file.name);

  const result = await executeFetch<ResponseType>(() => {
    return fetch(`/api/croak/top/file`, {
      method: 'POST',
      body: formData,
    })
  });

  return result as ResponseType;
};
