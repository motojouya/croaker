import React from "react";
import { lineCount } from "@/domain/text";

export const MultiLineText: React.FC<{
  text: string;
}> = ({ text }) => (
  <>
    {text.split("\n").map((item, index) => (
      <React.Fragment key={index}>
        {item}
        <br />
      </React.Fragment>
    ))}
  </>
);

export type UseMultiLineText = () => [string, number, (text: string) => void, () => void];
export const useMultiLineText: UseMultiLineText = () => {
  const [text, setText] = React.useState("");
  const [rows, setRows] = React.useState(1);

  const set = (text: string) => {
    setRows(lineCount(text.split("\n")) || 1);
    setText(text);
  };

  const clear = () => {
    setRows(1);
    setText("");
  };

  return [text, rows, set, clear];
};
