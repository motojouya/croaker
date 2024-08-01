import Sqlite from "better-sqlite3";
import {
  Kysely,
  SqliteDialect,
  KyselyPlugin,
  OperationNodeTransformer,
  ValueNode,
  ValuesNode,
  PrimitiveValueListNode,
  InsertQueryNode,
  PluginTransformResultArgs,
  PluginTransformQueryArgs,
  RootOperationNode,
  QueryResult,
  UnknownRow,
} from "kysely";
import { Database } from "@/database/type";
import { KyselyAuth } from "@auth/kysely-adapter";

export class SqliteBooleanPlugin implements KyselyPlugin {
  readonly transformer = new SqliteBooleanTransformer()

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return this.transformer.transformNode(args.node)
  }

  transformResult(
    args: PluginTransformResultArgs
  ): Promise<QueryResult<UnknownRow>> {
    return Promise.resolve(args.result)
  }
}

class SqliteBooleanTransformer extends OperationNodeTransformer {
  transformValue(node: ValueNode): ValueNode {
    return {
      ...super.transformValue(node),
      value: typeof node.value === 'boolean' ? (node.value ? 1 : 0) : node.value
    }
  }

  transformInsertQuery(node: InsertQueryNode): InsertQueryNode {
    if (node.values) {
      if (ValuesNode.is(node.values)) {
        return {
          ...super.transformInsertQuery(node),
          values: {
            kind: 'ValuesNode',
            // @ts-ignore
            values: node.values.values.map((value) => {
              if (PrimitiveValueListNode.is(value)) {
                return {
                  kind: 'PrimitiveValueListNode',
                  values: value.values.map((v) => typeof v === 'boolean' ? (v ? 1 : 0) : v)
                };
              } else {
                return value;
              }
            })
          } as const
        }
      } else {
        return super.transformInsertQuery(node);
      }
    } else {
      return super.transformInsertQuery(node);
    }
  }
}

export type GetKysely = () => Kysely<Database>;
export const getKysely: GetKysely = () => {
  return new KyselyAuth<Database>({
    dialect: new SqliteDialect({
      database: new Sqlite(process.env.SQLITE_FILE),
    }),
    plugins: [new SqliteBooleanPlugin()],
  });
};
