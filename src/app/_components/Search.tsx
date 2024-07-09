'use client';

import { useState } from 'react';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MagnifyingGlassIcon } from "@radix-ui/react-icons"

export const dynamic = 'force-dynamic';

export type ActionCallback = (text: string) => void;
export type UseSeachReturn = {
  inputState: boolean,
  setText: (text: string) => void,
  action: (callback: ActionCallback) => void,
};

  export type SetText = (text: string) => void;

export type UseSearch = (defaultSearchText: string) => UseSeachReturn;
export const useSearch: UseSearch = (defaultSearchText) => {

  console.log(defaultSearchText);
  const [inputState, setInputState] = useState(false);
  const [searchText, setSearchText] = useState(defaultSearchText);

  const action = (callback: SetText) => {

    if (!inputState) {
      setSearchText(defaultSearchText);
      setInputState(true);
      return;
    }

    if (!searchText || searchText === defaultSearchText) {
      setSearchText(defaultSearchText);
      setInputState(false);
      return;
    }

    callback(searchText);
  };

  return {
    inputState,
    searchText,
    setText: setSearchText,
    action,
  };
};

// export const Search: React.FC<{
//   inputState: boolean,
//   setText: SetText,
//   action: () => void,
// }> = ({ inputState, setText, action }) => {
//   return (
//     <>
//       {!!inputState && (
//         <Input type="text" placeholder="Search" onChange={(e) => setText(e.target.value)}/>
//       )}
//       <Button
//         type="submit"
//         variant="outline"
//         size="icon"
//         onSubmit={action}
//       >
//         <MagnifyingGlassIcon className="h-4 w-4" />
//       </Button>
//     </>
//   );
// };
