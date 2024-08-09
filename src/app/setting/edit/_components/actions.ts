"use server";

import { bindContext } from "@/lib/base/context";
import { z } from "zod";
import { getServerAction } from "@/lib/next/serverActions";
import { createCroaker } from "@/case/croaker/createCroaker";
import { editCroaker } from "@/case/croaker/editCroaker";

const croakerSchema = z.object({
  croaker_editable_input: z.object({
    name: z.string(),
    description: z.string(),
  }),
  form_agreement: z.boolean().nullable(),
});

export const createCroakerAction = getServerAction(croakerSchema, "/setting/edit", null, (identifier, b) =>
  bindContext(createCroaker)(identifier)(b.croaker_editable_input, b.form_agreement || undefined),
);

export const editCroakerAction = getServerAction(croakerSchema, "/setting/edit", null, (identifier, b) =>
  bindContext(editCroaker)(identifier)(b.croaker_editable_input, b.form_agreement || undefined),
);
