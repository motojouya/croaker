import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { $Compiler, wrapCompilerAsTypeGuard } from 'json-schema-to-ts';
import { HandleableError } from '@/lib/error';

const JSON_SCHEMA_TYPE_OBJECT = 'object';
const JSON_SCHEMA_TYPE_ARRAY = 'array';
const JSON_SCHEMA_TYPE_STRING = 'string';
const JSON_SCHEMA_TYPE_INTEGER = 'integer';
const JSON_SCHEMA_TYPE_NUMBER = 'number';
const JSON_SCHEMA_TYPE_BOOLEAN = 'boolean';

let jsonSchema;

const getJsonSchema = () => {
  if (!jsonSchema) {
    const ajv = new Ajv();
    addFormats(ajv);
    const $compile: $Compiler = schema => ajv.compile(schema);
    const createValidationCompiler = () => wrapCompilerAsTypeGuard($compile);
    const compile = createValidationCompiler(),
    jsonSchema = {
      compile,
      getKeyValue: getKeyValue(compile),
    };
  }
  return jsonSchema;
};

function getKeyValue(schemaCompiler) {
  return function <T extends JSONSchema>(schema: T, get: (key: string) => string | null | undefined): FromSchema<T> | InvalidArgumentsError | JsonSchemaError {

    if (!schema.type || schema.type !== JSON_SCHEMA_TYPE_OBJECT) {
      throw new Error('top level json schema shoud be object');
    }

    const required = schema.required;

    let keyValue = {};
    for (const key in schema) {

      if (!Object.hasOwn(schema, key)) {
        continue;
      }

      const def = schema[key];
      const raw = get(key);

      if (raw === undefined) {
        if (required.some(r => key === r)) {
          return new InvalidArgumentsError(key, val, `${key}を定義してください`);
        }
        continue;
      }

      if (raw === null) {
        if (!def.nullable) {
          return new InvalidArgumentsError(key, val, `${key}がNull以外です`);
        }
        keyValue = {
          ...keyValue,
          [key]: null,
        };
        continue;
      }

      let val;
      switch (def.type) {
        case JSON_SCHEMA_TYPE_STRING: {
          val = raw;
          break;
        }

        case JSON_SCHEMA_TYPE_INTEGER: {
          val = Number(raw);
          if (Number.isNaN(val)) {
            return new InvalidArgumentsError(key, val, `${key}は${JSON_SCHEMA_TYPE_INTEGER}型です`);
          }
          if (Number.isSafeInteger(val)) {
            return new InvalidArgumentsError(key, val, `${key}は${JSON_SCHEMA_TYPE_INTEGER}型です`);
          }
          break;
        }

        case JSON_SCHEMA_TYPE_NUMBER: {
          val = Number(raw);
          if (Number.isNaN(val)) {
            return new InvalidArgumentsError(key, val, `${key}は${JSON_SCHEMA_TYPE_NUMBER}型です`);
          }
          break;
        }

        case JSON_SCHEMA_TYPE_BOOLEAN: {
          if (raw.toLowerCase() === "true") {
            val = true;
          } else if (raw.toLowerCase() === "false") {
            val = false;
          } else {
            val = !!raw;
          }
          break;
        }

        default: {
          throw new Error('property type shoud be string, integer, number, boolean');
        }
      }

      keyValue = {
        ...keyValue,
        [key]: val,
      };
    }

    const schemaCompiler = getSchemaCompiler();
    const validateSchema = schemaCompiler.compile(schema);
    if (!validateSchema(keyValue)) {
      // @ts-ignore
      const { errors } = validateSchema;
      console.debug(errors);
      return new JsonSchemaError(errors.propertyName, errors.data, errors, errors.message);
    }

    return keyValue;
  }
}

export class JsonSchemaError extends HandleableError {
  override readonly name = 'lib.jsonSchema.JsonSchemaError' as const;
  constructor(
    readonly property_name: string,
    readonly value: string,
    readonly error: Error,
    readonly message: string,
  ) {
    super();
  }
}
