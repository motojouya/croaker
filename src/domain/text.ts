import { InvalidArgumentsError } from '@/lib/base/validation';

export const NAME_COUNT_MAX = 40;
export const DESCRIPTION_COUNT_MAX = 1000;
export const CONTENTS_COUNT_MAX = 140;

export const URL_REG_EXP = new RegExp('^https:\/\/\S+$');

export type GetLinks = (text: string) => string[];
export const getLinks = (text) => {
  const lines = trimText(text);
  return lines.filter(line => URL_REG_EXP.test(line))
};

type TrimText = (text: string) => string[];
const trimText: TrimText = (text) => text
  .split('\n')
  .map(line => line.trimEnd());

type CharCount = (lines: string[]) => number;
const charCount: CharCount = (lines) => {

  if (lines.length === 0) {
    return 0;
  }

  const charactorCount = lines
    .map(line => [...line].length)
    .reduce((a, i) => (a + i), 0);

  return charactorCount + lines.length - 1;
}

export type TrimName = (name?: string) => string | InvalidArgumentsError;
export const trimName: TrimName = (name) => {

  if (!name) {
    return new InvalidArgumentsError('name', name, '名前を入力してください');
  }

  const lines = trimText(name);
  if (lines.length !== 1) {
    return new InvalidArgumentsError('name', name, '名前は改行できません');
  }

  const trimed = lines[0];

  if (!trimed) {
    return new InvalidArgumentsError('name', name, '名前を入力してください');
  }

  const len = [...trimed].length;
  if (len < 1 || NAME_COUNT_MAX < len) {
    return new InvalidArgumentsError('name', name, `名前は1文字以上${NAME_COUNT_MAX}以下です`);
  }

  return trimed;
};

export type TrimDescription = (description?: string) => string | InvalidArgumentsError;
export const trimDescription: TrimDescription = (description) => {

  if (!description) {
    return '';
  }

  const lines = trimText(description);
  if (lines.length === 0) {
    return '';
  }

  const len = charCount(lines);
  if (DESCRIPTION_COUNT_MAX < len) {
    return new InvalidArgumentsError('name', name, `説明は${DESCRIPTION_COUNT_MAX}以下です`);
  }

  return lines.join('\n');
};

export type TrimContents = (contents?: string) => string | InvalidArgumentsError;
export const trimContents: TrimContents = (contents) => {

  if (!contents) {
    return new InvalidArgumentsError('contents', contents, '入力してください');
  }

  const lines = trimText(contents);
  if (lines.length === 0) {
    return new InvalidArgumentsError('contents', contents, '入力してください');
  }

  const len = charCount(lines);
  if (len < 1 || CONTENTS_COUNT_MAX < len) {
    return new InvalidArgumentsError('name', name, `1文字以上${CONTENTS_COUNT_MAX}以下です`);
  }

  return lines.join('\n');
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

