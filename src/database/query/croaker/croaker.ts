import { CroakerRecord } from "@/database/type/croak";
import { RoleRecord } from "@/database/type/master";

export type Role = Omit<RoleRecord, "role_id">;
export type Croaker = Omit<CroakerRecord, "user_id" | "role_id" | "name"> & {
  croaker_name: string;
  role: Role;
};

export type CroakerWithRole = Omit<CroakerRecord, "user_id" | "role_id" | "name"> & {
  croaker_name: CroakerRecord["name"];
  role_name: RoleRecord["name"];
  role_ban_power: RoleRecord["ban_power"];
  role_delete_other_post: RoleRecord["delete_other_post"];
  role_post: RoleRecord["post"];
  role_post_file: RoleRecord["post_file"];
  role_top_post_interval: RoleRecord["top_post_interval"];
  role_show_other_activities: RoleRecord["show_other_activities"];
};

export type CreateCroaker = (croakers: CroakerWithRole[]) => Croaker | null;
export const createCroaker: CreateCroaker = (croakers) => {
  if (croakers.length > 1) {
    throw new Error("croaker is unique by croaker_id or user_id!");
  }

  if (croakers.length === 0) {
    return null;
  }

  const {
    role_name,
    role_ban_power,
    role_delete_other_post,
    role_post,
    role_post_file,
    role_top_post_interval,
    role_show_other_activities,
    ...rest
  } = croakers[0];

  return {
    ...rest,
    role: {
      name: role_name,
      ban_power: role_ban_power,
      delete_other_post: role_delete_other_post,
      post: role_post,
      post_file: role_post_file,
      top_post_interval: role_top_post_interval,
      show_other_activities: role_show_other_activities,
    },
  };
};
