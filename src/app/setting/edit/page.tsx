"use client";

import type { ResponseType as ResponseTypeNew } from "@/app/api/croaker/self/new/route";
import type { ResponseType as ResponseTypeEdit } from "@/app/api/croaker/self/edit/route";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { AboutCroaker } from "@/components/parts/AboutCroaker";
import { doFetch } from "@/lib/next/utility";
import { useMaster } from "@/app/SessionProvider";
import { isRecordNotFound } from "@/database/fail";
import { isAuthorityFail } from "@/domain/authorization/base";
import { isInvalidArguments } from "@/lib/base/validation";

const croakerEditFormSchema = z.object({
  name: z.string().refine((val) => Boolean(val.trim().length), "Name Required"),
  description: z.string(),
  form_agreement: z.boolean(),
});
type CroakerEditForm = z.infer<typeof croakerEditFormSchema>;

const createCroaker = async (data: CroakerEditForm, callback: () => void) => {
  const body = {
    croaker_editable_input: {
      name: data.name,
      description: data.description,
    },
    form_agreement: data.form_agreement,
  };

  const result = await doFetch<ResponseTypeNew>(`/api/croaker/self/new`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (isAuthorityFail(result) || isInvalidArguments(result)) {
    alert(result.message);
    return;
  }

  callback();
};

const editCroaker = async (data: CroakerEditForm, formAgreementAlready: boolean, callback: () => void) => {
  const body = {
    croaker_editable_input: {
      name: data.name,
      description: data.description,
    },
  } as any;
  if (!formAgreementAlready) {
    body.form_agreement = data.form_agreement;
  }

  const result = await doFetch<ResponseTypeEdit>(`/api/croaker/self/edit`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (isAuthorityFail(result) || isRecordNotFound(result) || isInvalidArguments(result)) {
    alert(result.message);
    return;
  }

  callback();
};

export default function Page() {
  const router = useRouter();
  const { configuration, croaker } = useMaster();

  let defaultValues: CroakerEditForm = {
    name: "",
    description: "",
    form_agreement: false,
  };
  if (croaker.type === "registered") {
    defaultValues = {
      name: croaker.value.croaker_name,
      description: croaker.value.description,
      form_agreement: croaker.value.form_agreement,
    };
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CroakerEditForm>({
    resolver: zodResolver(croakerEditFormSchema),
    defaultValues,
  });

  const onSubmit = async (data: CroakerEditForm) => {
    const afterCallback = () => {
      // TODO page移動したあとにreload走る？
      router.push("/setting");
      window.location.reload();
    };

    if (croaker.type === "registered") {
      editCroaker(data, croaker.value.form_agreement, afterCallback);
    } else {
      createCroaker(data, afterCallback);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {croaker.type === "registered" && (
        <div className="m-2">
          <p>{`@${croaker.value.croaker_id}`}</p>
        </div>
      )}
      <div className="m-2">
        <Input type="text" placeholder="Name" {...register("name")} />
        {errors.name && <span className="text-red-500">{errors.name.message}</span>}
      </div>
      <div className="m-2">
        <Textarea placeholder="Description" {...register("description")} />
      </div>
      {(croaker.type !== "registered" || !croaker.value.form_agreement) && (
        <div className="my-5 mx-2">
          <p className="text-xl">Please Agree About Croaker Condition</p>
          <AboutCroaker aboutContents={configuration.about_contents} title={false} />
          <center className="mt-2">
            <Checkbox id="about_croaker_agreement" {...register("form_agreement")} />
            <label htmlFor="about_croaker_agreement" className="ml-2">
              Agree About Croaker Condition
            </label>
          </center>
        </div>
      )}
      <div className="m-2">
        <center>
          <Button type="submit" variant="outline">
            <p>Submit</p>
          </Button>
        </center>
      </div>
    </form>
  );
}
