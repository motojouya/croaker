import { FunctionResult, postFileCroak } from '@/case/croak/postFileCroak';
import { bindContext } from '@/lib/base/context';
import { FetchType, getFormHandler, executeFetch } from '@/lib/next/routeHandler';

export type ResponseType = FunctionResult;

export const POST = getFormHandler(
  null,
  null,
  'file'
  (p, f, file) => bindContext(postFileCroak)(file)
);

export type GetFetcher = (f: FetchType) => (file: File) => Promise<ResponseType>;
export const getFetcher = (f) => async (file) => {

  const formData = new FormData();
  formData.append("file", file, file.name);

  return executeFetch<ResponseType>(() => {
    return f(`/api/croak/top/file`, {
      method: 'POST',
      body: formData,
    })
  });
};
