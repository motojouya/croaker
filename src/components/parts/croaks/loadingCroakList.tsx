import React from "react";
import { useCallback, useState, useEffect } from "react";
import { Croak as CroakType } from "@/domain/croak/croak";
import type { ResponseType } from "@/app/api/croak/top/route";
import { isFileFail } from "@/lib/io/fileStorageFail";
import { replaceArray, removeArray } from "@/lib/next/utility";
import type { Croaker } from "@/database/query/croaker/croaker";
import { Croak, InputTextCroak, InputFileCroak, MessageItem } from "@/components/parts/croaks/croak";

// TODO test data
const posts = Array(20)
  .fill(0)
  .map((v, index) => ({
    croak_id: index,
    croaker_id: "own6r",
    contents: "test" + index,
    thread: null,
    posted_date: new Date(),
    deleted_date: null,
    has_thread: false,
    croaker_name: "name",
    links: [],
    files: [],
  }));
posts.splice(1, 1, {
  croak_id: 1,
  croaker_id: "own6r",
  contents: "test1\ntest0test0test0test0test0test0test0test0test0111111111test01\nテストなんですねん",
  thread: null,
  posted_date: new Date(),
  deleted_date: null,
  has_thread: false,
  croaker_name: "test_name",
  links: [],
  files: [],
});

type EqualCroak = (left: CroakType, right: CroakType) => boolean;
const equalCroak: EqualCroak = (left, right) => left.croak_id === right.croak_id;

// TODO load eventをbindしてるやつだけでいいので、表示されたらurlのhashを書き換えておく。page backの際に表示の再現のため
// TODO startingPointを使って最初のものはカーソル移動する
// https://dev.classmethod.jp/articles/react-scroll-into-view-on-load/
const Croaks: React.FC<{
  croakList: CroakType[];
  loadSurround: () => void;
  startingPoint: boolean;
}> = ({ croakList, loadSurround, startingPoint }) => {
  const [croaks, setCroaks] = useState<CroakType[]>(croakList);

  return (
    <>
      {croaks.map((croak, index) => {
        return (
          <Croak
            loadSurround={index === 0 ? loadSurround : null}
            key={`croak-${croak.croak_id}`}
            croak={croak}
            deleteCroak={() => setCroaks(removeArray(equalCroak)(croak))}
            scrollHere={startingPoint && index === 0}
          />
        );
      })}
    </>
  );
};

type CroakGroupInformation = {
  offsetCursor: number | null;
  reverse: boolean;
  startingPoint: boolean;
};
type CroakGroupType =
  | (CroakGroupInformation & { type: "loading" })
  | (CroakGroupInformation & { type: "loaded"; croaks: CroakType[] })
  | (CroakGroupInformation & { type: "error"; errorMessage: string });

export type GetCroaks = (offsetCursor: number | null, reverse: boolean) => Promise<ResponseType>;

type EqualGroup = (left: CroakGroupType, right: CroakGroupType) => boolean;
const equalGroup: EqualGroup = (left, right) => {
  return (
    left.offsetCursor === right.offsetCursor &&
    left.reverse === right.reverse &&
    left.startingPoint === right.startingPoint
  );
};

/*
 * 順番が重要
 * 先に先頭をいじってしまうと、indexが変わるのでロジックがおかしくなる
 * 先に末尾にpush or 末尾削除して、その後、先頭にunshift or 先頭削除する
 *
 * ここではロード対象のcroakGroupの登録のみ。
 * 実際にロードするのは非同期で次のprocessで行う
 */
type SetSurroundCroakGroup = (
  loadCroaks: (newGroup: CroakGroupType) => Promise<void>,
) => (newGroup: CroakGroupType) => (oldGroups: CroakGroupType[]) => CroakGroupType[];
const setSurroundCroakGroup: SetSurroundCroakGroup = (loadCroaks) => (baseGroup) => (oldGroups) => {
  const croakGroupIndex = oldGroups.findIndex((croakGroup) => equalGroup(croakGroup, baseGroup));
  if (croakGroupIndex === -1) {
    return oldGroups;
  }

  const croakGroup = oldGroups.at(croakGroupIndex) as CroakGroupType;
  if (croakGroup.type !== "loaded" || croakGroup.croaks.length === 0) {
    return oldGroups;
  }

  // croakGroup.croaks.length === 0で既に弾いているので必ずある
  const firstCroak = croakGroup.croaks.at(0) as CroakType;
  const firstCursor = firstCroak.croak_id;
  const lastCroak = croakGroup.croaks.at(croakGroup.croaks.length - 1) as CroakType;
  const lastCursor = lastCroak.croak_id;

  let newCroakGroups = [...oldGroups];

  if (croakGroupIndex === oldGroups.length - 1) {
    const newGroup = {
      offsetCursor: lastCursor,
      reverse: false,
      startingPoint: false,
      type: "loading",
    } as const;
    newCroakGroups.push(newGroup);
    loadCroaks(newGroup); // TODO need setTime?
  } else if (croakGroupIndex < oldGroups.length - 3) {
    const spliceStart = croakGroupIndex + 2;
    const spliceQuantity = oldGroups.length - (1 + spliceStart);
    newCroakGroups.splice(spliceStart, spliceQuantity);
  }

  if (croakGroupIndex === 0) {
    const newGroup = {
      offsetCursor: firstCursor,
      reverse: true,
      startingPoint: false,
      type: "loading",
    } as const;
    newCroakGroups.unshift(newGroup);
    loadCroaks(newGroup); // TODO need setTime?
  } else if (croakGroupIndex > 2) {
    newCroakGroups.splice(0, croakGroupIndex - 2);
  }

  return newCroakGroups;
};

type ChangeCroakGroup = (groups: CroakGroupType[]) => CroakGroupType[];

type GetLoadCroakGroups = (
  getCroaks: GetCroaks,
  setCroakGroups: (setter: ChangeCroakGroup) => void,
) => (loadingGroup: CroakGroupType) => Promise<void>;
const getLoadCroakGroups: GetLoadCroakGroups = (getCroaks, setCroakGroups) => async (loadingGroup) => {
  const result = await getCroaks(loadingGroup.offsetCursor, loadingGroup.reverse);

  if (isFileFail(result)) {
    setCroakGroups(
      replaceArray(equalGroup)({
        ...loadingGroup,
        type: "error",
        errorMessage: result.message,
      }),
    );
  } else {
    setCroakGroups(
      replaceArray(equalGroup)({
        ...loadingGroup,
        type: "loaded",
        croaks: result,
      }),
    );
  }
};

type LoadGroups = (baseGroup: CroakGroupType) => () => void;
type UseCroakGroups = (getCroaks: GetCroaks) => [CroakGroupType[], LoadGroups];
const useCroakGroups: UseCroakGroups = (getCroaks) => {
  const [croakGroups, setCroakGroups] = useState<CroakGroupType[]>([]);

  const loadGroups: LoadGroups = (baseGroup) => () => {
    const loadCroakGroups = getLoadCroakGroups(getCroaks, setCroakGroups);
    setCroakGroups(setSurroundCroakGroup(loadCroakGroups)(baseGroup));
  };

  useEffect(() => {
    if (croakGroups.length === 0) {
      const startingGroup = {
        offsetCursor: null,
        reverse: false,
        startingPoint: true,
        type: "loading",
      } as const;
      setCroakGroups([startingGroup]);
      getLoadCroakGroups(getCroaks, setCroakGroups)(startingGroup); // TODO need setTime?
    }
  }, [croakGroups, getCroaks, setCroakGroups]);

  return [croakGroups, loadGroups];
};

export const LoadingCroaks: React.FC<{ getCroaks: GetCroaks }> = ({ getCroaks }) => {
  const [croakGroups, loadGroups] = useCroakGroups(getCroaks);
  return (
    <>
      {croakGroups.map((croakGroup) => {
        const key = `croak-group-${croakGroup.offsetCursor || "none"}-${croakGroup.reverse}`;
        if (croakGroup.type == "loading") {
          return <MessageItem key={key} message={"loading"} />;
        } else if (croakGroup.type == "loaded") {
          return (
            <React.Fragment key={key}>
              {croakGroup.croaks.length > 0 && (
                <Croaks
                  croakList={croakGroup.croaks}
                  loadSurround={loadGroups(croakGroup)}
                  startingPoint={croakGroup.startingPoint}
                />
              )}
            </React.Fragment>
          );
        } else {
          return <MessageItem key={key} message={`Error! ${croakGroup.errorMessage}`} />;
        }
      })}
      <Croaks
        croakList={posts}
        loadSurround={() => {
          console.log("TODO for test! loadSurround.");
        }}
        startingPoint={true}
      />
    </>
  );
};
