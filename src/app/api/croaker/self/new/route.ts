import { FunctionResult, createCroaker } from '@/case/croaker/createCroaker';
import { bindContext } from '@/lib/base/context';
import { FetchType, getBodyHandler, executeFetch } from '@/lib/next/routeHandler';
import { z } from 'zod';

export type ResponseType = FunctionResult;

const bodySchema = z.object({
  croaker_editable: z.object({
    name: z.string(),
    description: z.string(),
  }),
  form_agreement: z.boolean().nullable(),
});

export const POST = getBodyHandler(
  null,
  bodySchema,
  (identifier, b) => bindContext(createCroaker)(identifier)(b.croaker_editable, b.form_agreement)
);

export type FetchAPI = (name: string, description: string, formAgreement?: boolean) => Promise<ResponseType>;
export const fetchAPI: FetchAPI = async (name, description, formAgreement) => {
  const result = await executeFetch(() => {
    return fetch(`/api/croaker/self/new`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        description,
        form_agreement: formAgreement,
      }),
    })
  });
  return result as ResponseType;
};
