import { bindContext } from "@/lib/base/context";
import { getIdentifier } from "@/lib/next/utility";
import { getCroaker } from "@/case/croaker/getCroaker";
import { auth } from "@/lib/next/nextAuthOptions";
import { Badge } from "@/components/ui/badge";
import { Profile } from "@/components/parts/Profile";
import { Button } from "@/components/ui/button";
import { ValueNoneIcon } from "@radix-ui/react-icons";
import { doFetch } from "@/lib/next/utility";
import { ResponseType } from "@/app/api/croaker/[croaker_id]/ban/route";
import { isRecordNotFound } from "@/database/fail";
import { isAuthorityFail } from "@/domain/authorization/base";
// import { BanButton } from "@/app/croaker/[croaker_id]/_components/BanButton";

const croaker = {
  croaker_id: "vis1t",
  croaker_name: "test_visiter",
  description:
    "I am test visiter. I am test visiter. I am test visiter. I am test visiter.\nI am test visiter. I am test visiter.",
  status: "ACTIVE",
  form_agreement: new Date(),
  created_date: new Date(),
  updated_date: new Date(),
  role: {
    name: "VISITER",
    ban_power: false,
    delete_other_post: false,
    post: "TOP",
    post_file: false,
    top_post_interval: "",
    show_other_activities: false,
  },
} as const;

async function submitAction(formData: FormData) {
  "use server"
  console.log("hello,world");
}

const MyForm = () => {
  return (
    <form action={submitAction}>
      <button type="submit">submit</button>
    </form>
  )
}



const ban = async (croaker_id: string) => {
  if (!confirm("本当にBANして大丈夫ですか？")) {
    return;
  }

  const result = await doFetch<ResponseType>(`/api/croaker/${croaker_id}/ban`, { method: "POST" });

  if (isAuthorityFail(result) || isRecordNotFound(result)) {
    alert(result.message);
    return;
  }

  window.location.reload();
};

const BanButton: React.FC<{
  croaker_id: string;
}> = ({ croaker_id }) => (
  <Button type="button" variant="destructive" className="h-7 w-7" size="icon" onClick={() => ban(croaker_id)}>
    <ValueNoneIcon />
  </Button>
);




type ParamsType = {
  params: {
    croaker_id: string;
  };
};
export default function Page({ params }: ParamsType) {
  // const session = await auth();
  // const identifier = getIdentifier(session);
  // const croaker = await bindContext(getCroaker)(identifier)(params.croaker_id);

  return (
    <Profile croaker={croaker}>
      <BanButton croaker_id={params.croaker_id} />
    </Profile>
  );
}
