export type TrimText = (text: string) => string[];
export const trimText: TrimText = (text) => text.split("\n").map((line) => line.trimEnd());

export type LineCount = (lines: string[]) => number;
export const lineCount: LineCount = (lines) => {
  if (lines.length === 0) {
    return 0;
  }

  const lineCount = lines.map((line) => Math.ceil([...line].length / 60)).reduce((a, i) => a + i, 0);

  return lineCount + lines.length - 1;
};

export type CharCount = (lines: string[]) => number;
export const charCount: CharCount = (lines) => {
  if (lines.length === 0) {
    return 0;
  }

  const charactorCount = lines.map((line) => [...line].length).reduce((a, i) => a + i, 0);

  return charactorCount + lines.length - 1;
};
// const nl2br = (text) => {
//   const texts = text.split('\n').map((item, index) => {
//     return (
//       <React.Fragment key={index}>
//         {item}<br />
//       </React.Fragment>
//     );
//   });
//   return <div>{texts}</div>;
// }
//
// import { createElement, type ReactNode } from 'react'
// const nl2br = (text: string): ReactNode[] =>
//   text
//     .split('\n')
//     .map((line, index) => [line, createElement('br', { key: index })])
//     .flat()
//     .slice(0, -1)
