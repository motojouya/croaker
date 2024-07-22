import React from 'react'
import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PaperPlaneIcon, ImageIcon } from "@radix-ui/react-icons";

export const RegisterFooter: React.FC<{
  linkUrl: string;
  linkName: string;
  description: string;
}> = ({ linkUrl, linkName, description }) => (
  <footer className="fixed bottom-0 left-0 w-screen min-h-12 flex flex-nowrap justify-center items-center bg-white border-t">
    <div className="flex flex-nowrap justify-between items-center w-full max-w-5xl h-12">
      <div className="grow shrink m-2">
        <p>{description}</p>
      </div>
      <div className="grow-0 shrink-0 m-2">
        <Link href={linkUrl} className={buttonVariants({ variant: "procedure" })}>
          <p>{linkName}</p>
        </Link>
      </div>
    </div>
  </footer>
);

type PostText = (text: string) => void;
type PostFile = (file: File) => void;

export const CroakInputFooter: React.FC<{
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

  const onChangeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      if (confirm(`${files[0]}をUploadしますか？`)) {
        postFile(files[0]);
      }
    }
  }

  // TODO input file装飾
  // https://qiita.com/shuheix/items/f618e9d6cdd063e10b72
  return (
    <footer className="fixed bottom-0 left-0 w-screen min-h-12 flex flex-nowrap justify-center items-center bg-white border-t">
      <div className="flex flex-nowrap justify-between items-center w-full max-w-5xl">
        <div className="grow-0 shrink-0 my-1 mr-0 ml-1">
          <input
            name="file"
            type="file"
            accept="image/*"
            onChange={onChangeFile}
          />
          <Button type="button" variant="link" size="icon" onClick={() => console.log('TODO file!')}>
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
    </footer>
  );
};
