import { FunctionResult, editCroaker } from '@/case/croaker/editCroaker';
import { bindContext } from '@/lib/base/context';
import { FetchType, getBodyHandler, executeFetch } from '@/lib/next/routeHandler';

export type ResponseType = FunctionResult;

const bodySchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    form_agreement: { type: 'boolean' },
  },
  required: ['name', 'description'],
} as const satisfies JSONSchema;

export const POST = getBodyHandler(
  null,
  bodySchema,
  (p) => bindContext(editCroaker)(p.identifier)
);

export type GetFetcher = (f: FetchType) => (name: string, description: string, formAgreement?: boolean) => Promise<ResponseType>;
export const getFetcher = (f) => async (name, description, formAgreement) => {
  return executeFetch<ResponseType>(() => {
    return f(`/api/croaker/self`, {
      method: 'POST',
      body: {
        name,
        description,
        form_agreement: formAgreement,
      },
    })
  });
};
