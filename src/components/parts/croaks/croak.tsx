import React from "react";
import Link from "next/link";
import Image from "next/image";
import { RefObject, useCallback, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Croak as CroakType } from "@/domain/croak/croak";
import { format } from "date-fns";
import { MultiLineText } from "@/components/parts/MultiLineText";
import { ResponseType } from "@/app/api/croak/[croak_id]/delete/route";
import { isRecordNotFound } from "@/database/fail";
import { isAuthorityFail } from "@/domain/authorization/base";
import { doFetch } from "@/lib/next/utility";
import type { Croaker } from "@/database/query/croaker/croaker";

export const MessageItem: React.FC<{ message: string }> = ({ message }) => <p>{message}</p>;

const intersectionObserverOptions = {
  root: null,
  rootMargin: "0px",
  threshold: 0,
};

type EffectScrollIntersection = (
  loadSurround: (() => void) | null,
  ref: RefObject<HTMLDivElement>,
) => (() => void) | undefined;
const effectScrollIntersection: EffectScrollIntersection = (loadSurround, ref) => {
  const target = ref.current;
  if (loadSurround && target) {
    const observer = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).forEach((entry) => loadSurround());
    }, intersectionObserverOptions);

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }
};

type EffectFocusScroll = (scrollHere: boolean, ref: RefObject<HTMLDivElement>) => undefined;
const effectFocusScroll: EffectFocusScroll = (scrollHere, ref) => {
  if (scrollHere && ref && ref.current) {
    ref.current.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }
};

type DeleteCroakFetch = (croak_id: number, callback: () => void) => Promise<void>;
const deleteCroakFetch: DeleteCroakFetch = async (croak_id, callback) => {
  if (!confirm("本当に削除して大丈夫ですか？")) {
    return;
  }

  const result = await doFetch<ResponseType>(`/api/croak/${croak_id}/delete`, { method: "POST" });

  if (isAuthorityFail(result) || isRecordNotFound(result)) {
    alert(result.message);
    return;
  }

  callback();
};

const DivRef: React.FC<{
  divRef: RefObject<HTMLDivElement> | null;
  children: React.ReactNode;
}> = ({ divRef, children }) => {
  if (divRef) {
    return (
      <div ref={divRef} className="w-full max-w-5xl">
        {children}
      </div>
    );
  } else {
    return <div className="w-full max-w-5xl">{children}</div>;
  }
};

export const Croak: React.FC<{
  croak: CroakType;
  deleteCroak: () => void;
  loadSurround: (() => void) | null;
  scrollHere: boolean;
}> = ({ croak, deleteCroak, loadSurround, scrollHere }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(`${window.location.protocol}://${window.location.host}/#${croak.croak_id}`);
    setCopied(true);
  };

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => effectScrollIntersection(loadSurround, ref), [loadSurround, ref]);

  useEffect(() => effectFocusScroll(scrollHere, ref), [scrollHere, ref]);

  return (
    <DivRef divRef={loadSurround ? ref : null}>
      <div className="w-full max-w-5xl flex flex-nowrap justify-start items-center h-4 text-xs mx-1">
        <div className="grow shrink flex flex-nowrap justify-start items-center mr-1">
          <div className="font-bold">{`${croak.croaker_name}@${croak.croaker_id}`}</div>
          <div className="ml-1">{format(croak.posted_date, "yyyy/MM/dd HH:mm")}</div>
        </div>
        <div className="grow-0 shrink-0 mr-1 w-10 text-center underline">
          <Link href={`/thread/${croak.croak_id}`}>
            <p>Thread</p>
          </Link>
        </div>
        <div className="grow-0 shrink-0 mr-1 w-14 text-center">
          <Button
            type="button"
            variant="link"
            size="icon"
            onClick={copy}
            className="text-xs h-4 font-normal underline decoration-blue-500"
          >
            <p>{copied ? "Copied" : "CopyURL"}</p>
          </Button>
        </div>
        <div className="grow-0 shrink-0 mr-1 w-10 text-center">
          <Button
            type="button"
            variant="link"
            size="icon"
            onClick={() => deleteCroakFetch(croak.croak_id, deleteCroak)}
            className="text-xs h-4 font-normal underline decoration-red-500"
          >
            <p>Delete</p>
          </Button>
        </div>
      </div>
      <div className="w-full max-w-5xl mx-1 mb-3">
        {croak.contents && (
          <div className="max-w-fit break-words">
            <MultiLineText text={croak.contents || ""} />
          </div>
        )}
        {croak.files.length > 0 && (
          <div>
            {croak.files.map((file, index) => {
              if (file.content_type.startsWith("image")) {
                return <Image key={`croak-${croak.croak_id}-file-${index}`} src={file.url} alt={file.name} />;
              } else {
                return file.name;
              }
            })}
          </div>
        )}
        {croak.links.length > 0 && (
          <div>
            {croak.links.map((link, index) => (
              <React.Fragment key={`croak-${croak.croak_id}-link-${index}`}>
                <Link href={link.url || ""}>
                  <p>{link.title || ""}</p>
                  {link.image && <Image src={link.image} alt={link.title || ""} />}
                  <MultiLineText text={link.description || ""} />
                </Link>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </DivRef>
  );
};

export const InputFileCroak: React.FC<{
  croaker: Croaker;
  file: File;
  message: string;
  deleteCroak: (() => void) | null;
  scrollHere: boolean;
}> = ({ croaker, file, message, deleteCroak, scrollHere }) => {
  const [fileSrc, setFileSrc] = useState<string | null>(null);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => setFileSrc(reader.result as string);
  });

  useEffect(() => effectFocusScroll(scrollHere, ref), [scrollHere, ref]);

  return (
    <DivRef divRef={scrollHere ? ref : null}>
      <div className="w-full max-w-5xl flex flex-nowrap justify-start items-center h-4 text-xs mx-1">
        <div className="grow shrink flex flex-nowrap justify-start items-center mr-1">
          <div className="font-bold">{`${croaker.croaker_name}@${croaker.croaker_id}`}</div>
        </div>
        {deleteCroak && (
          <div className="grow-0 shrink-0 mr-1 w-10 text-center">
            <Button
              type="button"
              variant="link"
              size="icon"
              onClick={deleteCroak}
              className="text-xs h-4 font-normal underline decoration-red-500"
            >
              <p>Delete</p>
            </Button>
          </div>
        )}
      </div>
      <div className="w-full max-w-5xl mx-1 mb-3">
        <div>{fileSrc && <Image src={fileSrc} alt={file.name} />}</div>
      </div>
    </DivRef>
  );
};

export const InputTextCroak: React.FC<{
  croaker: Croaker;
  contents: string;
  message: string;
  deleteCroak: (() => void) | null;
  scrollHere: boolean;
}> = ({ croaker, contents, message, deleteCroak, scrollHere }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => effectFocusScroll(scrollHere, ref), [scrollHere, ref]);

  return (
    <DivRef divRef={scrollHere ? ref : null}>
      <div className="w-full max-w-5xl flex flex-nowrap justify-start items-center h-4 text-xs mx-1">
        <div className="grow shrink flex flex-nowrap justify-start items-center mr-1">
          <div className="font-bold">{`${croaker.croaker_name}@${croaker.croaker_id}`}</div>
        </div>
        {deleteCroak && (
          <div className="grow-0 shrink-0 mr-1 w-10 text-center">
            <Button
              type="button"
              variant="link"
              size="icon"
              onClick={deleteCroak}
              className="text-xs h-4 font-normal underline decoration-red-500"
            >
              <p>Delete</p>
            </Button>
          </div>
        )}
      </div>
      <div className="w-full max-w-5xl mx-1 mb-3">
        <div className="max-w-fit break-words">
          <MultiLineText text={contents || ""} />
        </div>
      </div>
    </DivRef>
  );
};
