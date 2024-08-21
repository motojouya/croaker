import { bindContext } from "@/lib/base/context";
import { getIdentifier } from "@/lib/next/utility";
import { getCroaker } from "@/case/croaker/getCroaker";
import { auth } from "@/lib/next/nextAuthOptions";
import { Main } from "@/components/parts/main";
import { Profile } from "@/components/parts/Profile";
import { BanButton } from "@/app/croaker/[croaker_id]/_components/BanButton";

type ParamsType = {
  params: {
    croaker_id: string;
  };
};

export default async function Page({ params }: ParamsType) {
  const session = await auth();
  const identifier = getIdentifier(session);
  const croaker = await bindContext(getCroaker)(identifier)(params.croaker_id);

  // TODO
  if (!croaker) {
    return <div>ユーザが見つかりません</div>;
  }

  return (
    <Main>
      <Profile croaker={croaker}>
        <BanButton croaker_id={params.croaker_id} />
      </Profile>
    </Main>
  );
}
