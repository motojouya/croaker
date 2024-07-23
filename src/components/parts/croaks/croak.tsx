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

  const res = await doFetch(`/api/croak/${croak_id}/delete`, { method: "POST" });
  const result = res as ResponseType;

  if (isAuthorityFail(result) || isRecordNotFound(result)) {
    alert(result.message);
    return;
  }

  callback();
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
    <div>
      <div>
        {loadSurround && <div ref={ref}>{`${croak.croaker_name}@${croak.croaker_id}`}</div>}
        {!loadSurround && <div>{`${croak.croaker_name}@${croak.croaker_id}`}</div>}
        <div>{format(croak.posted_date, "yyyy/MM/dd HH:mm")}</div>
        <div>
          <Link href={`/thread/${croak.croak_id}`}>
            <p>Thread</p>
          </Link>
        </div>
        <div>
          <Button type="button" variant="link" size="icon" onClick={copy}>
            {copied && <p>Copied!</p>}
            {!copied && <p>Copy URL</p>}
          </Button>
        </div>
        <div>
          <Button
            type="button"
            variant="link"
            size="icon"
            onClick={() => deleteCroakFetch(croak.croak_id, deleteCroak)}
          >
            <p>Delete</p>
          </Button>
        </div>
      </div>
      <div>
        <MultiLineText text={croak.contents || ""} />
      </div>
      <div>
        {croak.files.map((file, index) => {
          if (file.content_type.startsWith("image")) {
            return <Image key={`croak-${croak.croak_id}-file-${index}`} src={file.url} alt={file.name} />;
          } else {
            return file.name;
          }
        })}
      </div>
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
    </div>
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
    <div>
      <div>
        {scrollHere && <div ref={ref}>{`${croaker.croaker_name}@${croaker.croaker_id}`}</div>}
        {!scrollHere && <div>{`${croaker.croaker_name}@${croaker.croaker_id}`}</div>}
        <div>{message}</div>
        <div>
          {deleteCroak && (
            <Button type="button" variant="link" size="icon" onClick={deleteCroak}>
              <p>Delete</p>
            </Button>
          )}
        </div>
      </div>
      <div>{fileSrc && <Image src={fileSrc} alt={file.name} />}</div>
    </div>
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
    <div>
      <div>
        {scrollHere && <div ref={ref}>{`${croaker.croaker_name}@${croaker.croaker_id}`}</div>}
        {!scrollHere && <div>{`${croaker.croaker_name}@${croaker.croaker_id}`}</div>}
        <div>{message}</div>
        <div>
          {deleteCroak && (
            <Button type="button" variant="link" size="icon" onClick={deleteCroak}>
              <p>Delete</p>
            </Button>
          )}
        </div>
      </div>
      <div>
        <MultiLineText text={contents} />
      </div>
    </div>
  );
};
