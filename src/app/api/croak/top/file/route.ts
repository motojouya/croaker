import { FunctionResult, postFile } from "@/case/croak/postFileCroak";
import { bindContext } from "@/lib/base/context";
import { getFormHandler } from "@/lib/next/routeHandler";
import { z } from "zod";
import { ResultJson } from "@/lib/base/fail";

export type ResponseType = ResultJson<FunctionResult>;

export const POST = getFormHandler(null, null, "file", (identifier, p, f, file) => {
  if (!file) {
    throw new Error("file should be exist!");
  }
  return bindContext(postFile)(identifier)(file);
});

// import { FetchType, executeFetch } from '@/lib/next/routeHandler';
//
// export type FetchAPI = (file: File) => Promise<ResponseType>;
// export const fetchAPI: FetchAPI = async (file) => {
//
//   const formData = new FormData();
//   formData.append("file", file, file.name);
//
//   const result = await executeFetch(() => {
//     return fetch(`/api/croak/top/file`, {
//       method: 'POST',
//       body: formData,
//     })
//   });
//
//   return result as ResponseType;
// };
