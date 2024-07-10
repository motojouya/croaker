import { bindContext } from "@/lib/base/context";
import { getIdentifier } from "@/lib/next/routeHandler";
import { getCroaker } from "@/case/croaker/getCroaker";
import { auth } from "@/lib/next/nextAuthOptions";
import { Badge } from "@/components/ui/badge"
import { BanButton } from "@/app/croaker/[croaker_id]/_components/BanButton"

const croaker = {
  croaker_id: 'vis1t',
  croaker_name: 'test_visiter',
  description: 'I am test visiter. I am test visiter. I am test visiter. I am test visiter. I am test visiter.',
  status: 'ACTIVE',
  form_agreement: true,
  created_date: new Date(),
  updated_date: new Date(),
  role: {
    name: 'visiter',
    ban_power: false,
    delete_other_post: false,
    post: 'TOP',
    post_file: false,
    top_post_interval: '',
    show_other_activities: false,
  }
} as const;

type ParamsType = {
  params: {
    croaker_id: string
  }
};

export default function Page({ params }: ParamsType) {
  // const session = await auth();
  // const identifier = getIdentifier(session);
  // const croaker = await bindContext(getCroaker)(identifier)(params.croaker_id);

  return (
    <main className="w-screen min-h-screen flex flex-nowrap justify-center bg-white mt-12">
      <div className="w-full max-w-5xl">
        <div className="w-full mt-2 flex flex-nowrap justify-start items-center">
          <p className="mx-2 text-2xl">{croaker.croaker_name}</p>
          <BanButton croaker_id={params.croaker_id}/>
        </div>
        <div className="w-full flex flex-nowrap justify-start items-center">
          <p className="mx-2">{`@${croaker.croaker_id}`}</p>
          <p className="mx-2"><Badge>{croaker.status}</Badge></p>
          <p className="mx-2"><Badge>{croaker.role.name}</Badge></p>
        </div>
        <div className="w-full mt-5 flex flex-nowrap justify-start items-center">
          <p className="mx-2">{croaker.description}</p>
        </div>
      </div>
    </main>
  );
}
