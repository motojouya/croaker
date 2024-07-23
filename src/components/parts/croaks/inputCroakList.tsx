import React from "react";
import { useCallback, useState, useEffect } from "react";
import { Croak as CroakType } from "@/domain/croak/croak";
import type { ResponseType } from "@/app/api/croak/top/route";
import { isFileFail } from "@/lib/io/fileStorageFail";
import { replaceArray, removeArray } from "@/lib/next/utility";
import type { Croaker } from "@/database/query/croaker/croaker";
import { Croak, InputTextCroak, InputFileCroak } from "@/components/parts/croaks/croak";

export type PostingText = {
  key: string;
  type: "text";
  contents: string;
};
export type PostingFile = {
  key: string;
  type: "file";
  file: File;
};
export type ErrorText = {
  key: string;
  type: "text_error";
  contents: string;
  errorMessage: string;
};
export type ErrorFile = {
  key: string;
  type: "file_error";
  file: File;
  errorMessage: string;
};
export type PostedCroak = {
  key: string;
  type: "posted";
  croak: CroakType;
};

export type InputCroak = PostingText | PostingFile | ErrorText | ErrorFile | PostedCroak;

export const InputCroaks: React.FC<{
  croaker: Croaker;
  croaks: InputCroak[];
  cancelCroak: (inputCroak: InputCroak) => () => void;
}> = ({ croaker, croaks, cancelCroak }) => (
  <>
    {croaks.map((inputCroak, index) => {
      if (inputCroak.type === "text") {
        return (
          <InputTextCroak
            key={inputCroak.key}
            croaker={croaker}
            contents={inputCroak.contents}
            message={"loading..."}
            deleteCroak={null}
            scrollHere={index === 0}
          />
        );
      } else if (inputCroak.type === "file") {
        return (
          <InputFileCroak
            key={inputCroak.key}
            croaker={croaker}
            file={inputCroak.file}
            message={"loading..."}
            deleteCroak={null}
            scrollHere={index === 0}
          />
        );
      } else if (inputCroak.type === "text_error") {
        return (
          <InputTextCroak
            key={inputCroak.key}
            croaker={croaker}
            contents={inputCroak.contents}
            message={`Error! ${inputCroak.errorMessage}`}
            deleteCroak={cancelCroak(inputCroak)}
            scrollHere={false}
          />
        );
      } else if (inputCroak.type === "file_error") {
        return (
          <InputFileCroak
            key={inputCroak.key}
            croaker={croaker}
            file={inputCroak.file}
            message={`Error! ${inputCroak.errorMessage}`}
            deleteCroak={cancelCroak(inputCroak)}
            scrollHere={false}
          />
        );
      } else {
        return (
          <Croak
            key={inputCroak.key}
            croak={inputCroak.croak}
            deleteCroak={cancelCroak(inputCroak)}
            loadSurround={null}
            scrollHere={false}
          />
        );
      }
    })}
  </>
);
