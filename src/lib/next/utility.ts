import type { Session } from "next-auth";
import type { Identifier } from "@/domain/authorization/base";

export type FetchParam = Parameters<typeof fetch>;
export async function doFetch<T>(url: FetchParam[0], options: FetchParam[1]) {
  try {
    const res = await fetch(url, options);

    if (res.status >= 500) {
      console.log("server error!");
      throw new Error("server error!");
    }

    return (await res.json()) as T;
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

// for useState setter
export const replaceArray =
  <T>(equals: (left: T, right: T) => boolean) =>
  (newItem: T) =>
  (oldArray: T[]) => {
    const index = oldArray.findIndex((oldItem) => equals(oldItem, newItem));
    if (index === -1) {
      return oldArray;
    } else {
      return oldArray.toSpliced(index, 1, newItem);
    }
  };

export const removeArray =
  <T>(equals: (left: T, right: T) => boolean) =>
  (removeItem: T) =>
  (oldArray: T[]) => {
    const index = oldArray.findIndex((oldItem) => equals(oldItem, removeItem));
    if (index === -1) {
      return oldArray;
    } else {
      return oldArray.toSpliced(index, 1);
    }
  };
