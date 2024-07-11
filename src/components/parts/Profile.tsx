import type { Croaker } from "@/database/query/croaker/croaker";
import { Badge } from "@/components/ui/badge";
import { MultiLineText } from "@/components/parts/MultiLineText";

export const Profile: React.FC<{
  croaker: Croaker;
  children: React.ReactNode;
}> = ({ croaker, children }) => (
  <>
    <div className="w-full mt-2 flex flex-nowrap justify-start items-center">
      <p className="mx-2 text-2xl">{croaker.croaker_name}</p>
      {children}
    </div>
    <div className="w-full flex flex-nowrap justify-start items-center">
      <p className="mx-2">{`@${croaker.croaker_id}`}</p>
      <p className="mx-2">
        <Badge>{croaker.status}</Badge>
      </p>
      <p className="mx-2">
        <Badge>{croaker.role.name}</Badge>
      </p>
    </div>
    <div className="w-full mt-5 flex flex-nowrap justify-start items-center">
      <p className="mx-2">
        <MultiLineText text={croaker.description} />
      </p>
    </div>
  </>
);
