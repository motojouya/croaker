"use client";

import Link from "next/link";
import useSWR from "swr";
import { format } from "date-fns";

import type { ResponseType } from "@/app/api/croaker/self/recent_activities/route";
import { loadFetch } from "@/lib/next/utility";
import { isAuthorityFail } from "@/domain/authorization/base";

const croakSimples = [
  {
    croak_id: 11,
    croaker_id: "tes0t",
    contents: "",
    thread: null,
    posted_date: new Date(),
    deleted_date: null,
    croaker_name: "test some visiter",
    has_thread: false,
  },
  {
    croak_id: 21,
    croaker_id: "tes1t",
    contents: "",
    thread: 15,
    posted_date: new Date(),
    deleted_date: null,
    croaker_name: "test any visiter",
    has_thread: false,
  },
];

export const OthersActivities: React.FC<{}> = () => {
  const { data, error, isLoading } = useSWR("/api/croaker/self/recent_activities", loadFetch);
  const result = data as ResponseType;

  return (
    <div className="w-full mt-10">
      <div className="m-2 text-xl">
        <p>{"Other's Posts"}</p>
      </div>
      {isLoading && (
        <div className="w-full m-2 flex flex-nowrap justify-start items-center">
          <p>Now Loading</p>
        </div>
      )}
      {error && (
        <div className="w-full m-2 flex flex-nowrap justify-start items-center">
          <p>Fail To Load</p>
        </div>
      )}
      {data && isAuthorityFail(result) && (
        <div className="w-full m-2 flex flex-nowrap justify-start items-center">
          <p>{result.message}</p>
        </div>
      )}
      {croakSimples.map((croak, index) => {
        // TODO data && !isAuthorityFail(result)が条件
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
