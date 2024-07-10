"use client"

import { MainDiv } from "@/app/_components/MainDiv"
import { useMaster } from '@/app/SessionProvider';
import { AboutCroaker } from '@/components/parts/AboutCroaker'

export default function Page() {

  const master = useMaster();
  if (!master) {
    throw new Error('no configurations on session');
  }
  const { configuration, croaker } = master;

  return (
    <MainDiv>
      <AboutCroaker aboutContents={configuration.about_contents}/>
    </MainDiv>
  );
}
