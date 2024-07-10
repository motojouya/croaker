import type { Session } from "next-auth";
import type { Identifier } from "@/domain/authorization/base";

export type FetchType = typeof fetch;
export type FetchParam = Parameters<FetchType>;

export async function loadFetch(url: FetchParam[0]) {
  try {
    const res = await fetch(url);

    if (res.status >= 500) {
      console.log("server error!");
      throw new Error("server error!");
    }

    return await res.json();
  } catch (e) {
    console.log("network error!");
    throw e;
  }
}

export async function doFetch(url: FetchParam[0], options: FetchParam[1]) {
  try {
    const res = await fetch(url, options);

    if (res.status >= 500) {
      console.log("server error!");
      throw new Error("server error!");
    }

    return await res.json();
  } catch (e) {
    console.log("network error!");
    throw e;
  }
}

export async function executeFetch(callback: () => ReturnType<FetchType>) {
  try {
    const res = await callback();

    if (res.status >= 500) {
      console.log("server error!");
      throw new Error("server error!");
    }

    return await res.json();
  } catch (e) {
    console.log("network error!");
    throw e;
  }
}

export type GetIdentifier = (session: Session | null) => Identifier;
export const getIdentifier: GetIdentifier = (session) => {
  if (session) {
    return { type: "user_id", user_id: session.user.id };
  } else {
    return { type: "anonymous" };
  }
};
