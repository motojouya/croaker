import { FunctionResult, createCroaker } from "@/case/croaker/createCroaker";
import { bindContext } from "@/lib/base/context";
import { getBodyHandler } from "@/lib/next/routeHandler";
import { z } from "zod";
import { ResultJson } from "@/lib/base/fail";

export type ResponseType = ResultJson<FunctionResult>;

const bodySchema = z.object({
  croaker_editable_input: z.object({
    name: z.string(),
    description: z.string(),
  }),
  form_agreement: z.boolean().nullable(),
});

export const POST = getBodyHandler(null, bodySchema, (identifier, p, b) =>
  bindContext(createCroaker)(identifier)(b.croaker_editable_input, b.form_agreement || undefined),
);

// import { FetchType, executeFetch } from '@/lib/next/routeHandler';
//
// export type FetchAPI = (name: string, description: string, formAgreement?: boolean) => Promise<ResponseType>;
// export const fetchAPI: FetchAPI = async (name, description, formAgreement) => {
//   const result = await executeFetch(() => {
//     return fetch(`/api/croaker/self/new`, {
//       method: 'POST',
//       body: JSON.stringify({
//         name,
//         description,
//         form_agreement: formAgreement,
//       }),
//     })
//   });
//   return result as ResponseType;
// };
