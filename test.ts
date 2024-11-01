import { getMaster } from "@/case/getMaster";
import { Selectable } from "kysely";
import { Database } from "@/database/type";

const db = {
  read: (tableName: string, condition: object) => Promise.resolve([{
    title: 'croaker',
    active: 1,
    account_create_available: 1,
    default_role_id: 2,
    about_contents: 'this is about contents',
  } as Selectable<Database['configuration']>]),
  getCroakerUser: (user_id: string) => Promise.resolve({
    croaker_id: 'test_croaker_id',
    croaker_name: 'test user',
    description: 'self description',
    status: 'ACTIVE',
    role: {
      name: 'VISITOR',
      post: 'TOP',
      top_post_interval: '0',
      ban_power: false,
      delete_other_post: false,
      post_file: false,
      show_other_activities: false,
    },
    form_agreement: null,
    created_date: new Date(),
    updated_date: new Date(),
  }),
};

const identifier = {
  type: 'user_id',
  user_id: 'test',
} as const;

async function test() {
  // @ts-ignore
  const master = await getMaster({ db })(identifier)();
  console.log(master);
}

test();
