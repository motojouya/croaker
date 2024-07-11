import { bindContext } from "@/lib/base/context";
import { getIdentifier } from "@/lib/next/utility";
import { getCroaker } from "@/case/croaker/getCroaker";
import { auth } from "@/lib/next/nextAuthOptions";
import { Badge } from "@/components/ui/badge";
import { BanButton } from "@/app/croaker/[croaker_id]/_components/BanButton";
import { Profile } from "@/components/parts/Profile";

const croaker = {
  croaker_id: "vis1t",
  croaker_name: "test_visiter",
  description:
    "I am test visiter. I am test visiter. I am test visiter. I am test visiter.\nI am test visiter. I am test visiter.",
  status: "ACTIVE",
  form_agreement: true,
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
