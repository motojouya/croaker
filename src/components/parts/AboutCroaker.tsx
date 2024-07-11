import { MultiLineText } from "@/components/parts/MultiLineText";

export const AboutCroaker: React.FC<{ aboutContents: string; title?: boolean }> = ({ aboutContents, title = true }) => (
  <>
    {title && (
      <div className="w-full mt-2 flex flex-nowrap justify-start items-center">
        <p className="mx-2 text-2xl">About Croaker</p>
      </div>
    )}
    <div className="w-full mt-5 flex flex-nowrap justify-start items-center">
      <p className="mx-2">
        <MultiLineText text={aboutContents} />
      </p>
    </div>
  </>
);
