import { CroakRecord } from "@/database/type/croak";

export type CroakSimple = CroakRecord & {
  croaker_name: string;
  has_thread: boolean;
};
