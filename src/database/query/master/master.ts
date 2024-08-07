import { ConfigurationRecord } from "@/database/type/master";

export type Configuration = Omit<ConfigurationRecord, "active" | "account_create_available"> & {
  active: boolean;
  account_create_available: boolean;
};
