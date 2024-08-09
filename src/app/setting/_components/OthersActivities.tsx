import type { Identifier } from "@/domain/authorization/base";
import Link from "next/link";
import { format } from "date-fns";
import { isAuthorityFail } from "@/domain/authorization/base";
import { getRecentActivities } from "@/case/croaker/getRecentActivities";
import { bindContext } from "@/lib/base/context";

export const OthersActivities: React.FC<{ identifier: Identifier }> = async ({ identifier }) => {

  const recentActivities = await bindContext(getRecentActivities)(identifier)();

  return (
    <div className="w-full mt-10">
      <div className="m-2 text-xl">
        <p>{"Other's Posts"}</p>
      </div>
      {isAuthorityFail(recentActivities) && (
        <div className="w-full m-2 flex flex-nowrap justify-start items-center">
          <p>{recentActivities.message}</p>
        </div>
      )}
      {!isAuthorityFail(recentActivities) && recentActivities.map((croak, index) => {
        const linkCroakId = croak.thread || croak.croak_id;
        return (
          <Link
            href={`/#${linkCroakId}`}
            key={`activities-${index}`}
            className="w-full m-2 flex flex-nowrap justify-start items-center"
          >
            <div>{format(croak.posted_date, "yyyy/MM/dd HH:mm")}</div>
            <div className="ml-2">{`${croak.croaker_name}@${croak.croaker_id}`}</div>
          </Link>
        );
      })}
    </div>
  );
};
