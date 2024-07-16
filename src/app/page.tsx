'use client'

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useMaster } from "@/app/SessionProvider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PaperPlaneIcon, ImageIcon } from "@radix-ui/react-icons";
import { Croak as CroakType } from '@/database/query/croak/croak'
import { format } from "date-fns";
import { MultiLineText } from '@/components/parts/MultiLineText'

const posts = Array(20).map((v, index) => ({
  croak_id: index,
  croaker_id: 'own6r',
  contents: 'test' + index,
  thread: null,
  posted_date: new Date(),
  deleted_date: null,
  has_thread: false,
  croaker_name: 'name',
  links: [],
  files: [],
}));

const Croak: React.FC<{
  croak: CroakType;
  postText: PostText,
  postFile: PostFile,
}> = ({ croak }) => {

  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(`${window.location.protocol}://${window.location.host}/#${croak.croak_id}`);
    setCopied(true);
  };

  return (
    <div>
      <div>
        <div>{`${croak.croaker_name}@${croak.croaker_id}`}</div>
        <div>{format(croak.posted_date, "yyyy/MM/dd HH:mm")}</div>
        <div>
          <Link href={`/thread/${croak.croak_id}`}>
            <p>Thread</p>
          </Link>
        </div>
        <div>
          <Button type="button" variant="link" size="icon" onClick={copy}>
            {copied && (
              <p>Copied!</p>
            )}
            {!copied && (
              <p>Copy URL</p>
            )}
          </Button>
        </div>
        <div>
          <Button type="button" variant="link" size="icon" onClick={() => console.log('TODO delete!')}>
            <p>Delete</p>
          </Button>
        </div>
      </div>
      <div><MultiLineText text={croak.contents || ''} /></div>
    </div>
  );
};

export default function Page() {
  const mock = (text: string) => console.log(text);
  return (
    <>
      <div className="w-full mt-5 flex flex-nowrap justify-center items-center">
        <p>Developing</p>
      </div>
      <Footer
        postText={mock}
        postFile={mock}
      />
    </>
  );
}

type PostText = (text: string) => void;
type PostFile = (file: string) => void; // TODO 引数
const Footer: React.FC<{
  postText: PostText,
  postFile: PostFile,
}> = ({ postText, postFile }) => {
  const { configuration, croaker } = useMaster();

  return (
    <footer className="fixed bottom-0 left-0 w-screen min-h-12 flex flex-nowrap justify-center items-center bg-white border-t">
      {croaker.type === 'anonymous' && (
        <div className="flex flex-nowrap justify-between items-center w-full max-w-5xl h-12">
          <div className="grow shrink m-2">
            <p>You need Login and Register your Information</p>
          </div>
          <div className="grow-0 shrink-0 m-2">
            <Link href={"/auth/signin"} className={buttonVariants({ variant: "procedure" })}>
              <p>Login</p>
            </Link>
          </div>
        </div>
      )}
      {(croaker.type === 'logined' || (croaker.type === 'registered' && !croaker.value.form_agreement)) && (
        <div className="flex flex-nowrap justify-between items-center w-full max-w-5xl h-12">
          <div className="grow shrink m-2">
            <p>You need Register your Information and Agree Form</p>
          </div>
          <div className="grow-0 shrink-0 m-2">
            <Link href={"/setting/edit"} className={buttonVariants({ variant: "procedure" })}>
              <p>Register</p>
            </Link>
          </div>
        </div>
      )}
      {(croaker.type === 'registered' && croaker.value.form_agreement) && (
        <CroakInput postText={postText} postFile={postFile}/>
      )}
    </footer>
  );
};

const CroakInput: React.FC<{
  postText: PostText,
  postFile: PostFile,
}> = ({ postText, postFile }) => {

  const [croakText, setCroakText] = useState('');
  const [rows, setRows] = useState(1);

  const handleOnChange = (text: string) => {
    setRows(text.split('\n').length);
    setCroakText(text);
  }

  const submit = () => {
    postText(croakText);
    setRows(1);
    setCroakText('');
  };

  return (
    <div className="flex flex-nowrap justify-between items-center w-full max-w-5xl">
      <div className="grow-0 shrink-0 my-1 mr-0 ml-1">
        <Button type="button" variant="link" size="icon" onClick={() => postFile('file!')}>
          <ImageIcon />
        </Button>
      </div>
      <div className="grow shrink my-1">
        <Textarea
          rows={rows}
          placeholder="Post Croak..."
          value={croakText}
          onChange={(e) => handleOnChange(e.target.value)}
          className="p-1 min-h-fit border-t-0 border-x-0 rounded-none focus-visible:ring-0 bg-transparent"
        />
      </div>
      <div className="grow-0 shrink-0 my-1 mr-1 ml-0">
        <Button type="button" variant="link" size="icon" onClick={submit}>
          <PaperPlaneIcon />
        </Button>
      </div>
    </div>
  );
};
