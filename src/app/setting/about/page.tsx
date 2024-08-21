"use client";

import { useMaster } from "@/app/SessionProvider";
import { AboutCroaker } from "@/components/parts/AboutCroaker";
import { Main } from "@/components/parts/main";

export default function Page() {
  const { configuration, croaker } = useMaster();
  return (
    <Main>
      <AboutCroaker aboutContents={configuration.about_contents} />
    </Main>
  );
}
