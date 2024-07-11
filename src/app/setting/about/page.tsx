"use client";

import { useMaster } from "@/app/SessionProvider";
import { AboutCroaker } from "@/components/parts/AboutCroaker";

export default function Page() {
  const { configuration, croaker } = useMaster();
  return <AboutCroaker aboutContents={configuration.about_contents} />;
}
