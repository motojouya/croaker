import { FunctionResult, createCroaker } from '@/case/croaker/createCroaker';
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
  (identifier, b) => bindContext(createCroaker)(identifier)(b.name, b.description, b.form_agreement)
);

export type FetchAPI = (name: string, description: string, formAgreement?: boolean) => Promise<ResponseType>;
export const fetchAPI: FetchAPI = async (name, description, formAgreement) => {
  const result = await executeFetch(() => {
    return fetch(`/api/croaker/self/new`, {
      method: 'POST',
      body: {
        name,
        description,
        form_agreement: formAgreement,
      },
    })
  });
  return result as ResponseType;
};
