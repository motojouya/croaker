// import Ajv from 'ajv';
// import addFormats from 'ajv-formats';
// import { Validator, FromSchemaDefaultOptions, FromSchema, JSONSchema, $Validator, wrapValidatorAsTypeGuard } from 'json-schema-to-ts';
// // import { $Compiler, wrapCompilerAsTypeGuard } from "json-schema-to-ts";
// import { HandleableError } from '@/lib/base/error';
// import { InvalidArgumentsError } from '@/lib/base/validation';
// 
// const JSON_SCHEMA_TYPE_OBJECT = 'object';
// const JSON_SCHEMA_TYPE_ARRAY = 'array';
// const JSON_SCHEMA_TYPE_STRING = 'string';
// const JSON_SCHEMA_TYPE_INTEGER = 'integer';
// const JSON_SCHEMA_TYPE_NUMBER = 'number';
// const JSON_SCHEMA_TYPE_BOOLEAN = 'boolean';
// 
// export type JsonSchema = {
//   validate: ValidateFunc;
//   getKeyValue: ReturnType<typeof getKeyValue>;
// };
// 
// let jsonSchema: JsonSchema;
// 
// type ValidateFunc = Validator<FromSchemaDefaultOptions, []>; // ReturnType<typeof wrapValidatorAsTypeGuard>;
// type GetValidate = () => ValidateFunc;
// const getValidate: GetValidate = () => {
//   const ajv = new Ajv();
//   addFormats(ajv);
//   const $validate: $Validator = (schema, data) => ajv.validate(schema, data);
//   return wrapValidatorAsTypeGuard($validate);
// };
// 
// export const getJsonSchema = () => {
//   if (!jsonSchema) {
//     const validate = getValidate();
//     jsonSchema = {
//       validate,
//       getKeyValue: getKeyValue(validate),
//     };
//   }
//   return jsonSchema;
// };
// 
// function getKeyValue(validate: ValidateFunc) {
//   return function <T extends JSONSchema>(schema: T, get: (key: string) => string | null | undefined): FromSchema<T> | InvalidArgumentsError | JsonSchemaError {
// 
//     if (schema === true || schema === false) {
//       throw new Error('top level json schema shoud be object');
//     }
// 
//     if (!schema.type || schema.type !== JSON_SCHEMA_TYPE_OBJECT) {
//       throw new Error('top level json schema shoud be object');
//     }
// 
//     const required: readonly string[] = schema.required || [];
// 
//     const properties = schema.properties;
//     if (!properties) {
//       throw new Error('no properties defined');
//     }
// 
//     let keyValue = {};
//     for (const key in properties) {
// 
//       if (!Object.hasOwn(properties, key)) {
//         continue;
//       }
// 
//       const def = properties[key];
//       if (def === true || def === false) {
//         throw new Error('json schema properties shoud be object');
//       }
// 
//       const raw = get(key);
// 
//       if (raw === undefined) {
//         if (required.some(r => key === r)) {
//           return new InvalidArgumentsError(key, '', `${key}を定義してください`);
//         }
//         continue;
//       }
// 
//       if (raw === null) {
//         if (!def.nullable) {
//           return new InvalidArgumentsError(key, '', `${key}がNull以外です`);
//         }
//         keyValue = {
//           ...keyValue,
//           [key]: null,
//         };
//         continue;
//       }
// 
//       let val;
//       switch (def.type) {
//         case JSON_SCHEMA_TYPE_STRING: {
//           val = raw;
//           break;
//         }
// 
//         case JSON_SCHEMA_TYPE_INTEGER: {
//           val = Number(raw);
//           if (Number.isNaN(val)) {
//             return new InvalidArgumentsError(key, String(val), `${key}は${JSON_SCHEMA_TYPE_INTEGER}型です`);
//           }
//           if (Number.isSafeInteger(val)) {
//             return new InvalidArgumentsError(key, String(val), `${key}は${JSON_SCHEMA_TYPE_INTEGER}型です`);
//           }
//           break;
//         }
// 
//         case JSON_SCHEMA_TYPE_NUMBER: {
//           val = Number(raw);
//           if (Number.isNaN(val)) {
//             return new InvalidArgumentsError(key, String(val), `${key}は${JSON_SCHEMA_TYPE_NUMBER}型です`);
//           }
//           break;
//         }
// 
//         case JSON_SCHEMA_TYPE_BOOLEAN: {
//           if (raw.toLowerCase() === "true") {
//             val = true;
//           } else if (raw.toLowerCase() === "false") {
//             val = false;
//           } else {
//             val = !!raw;
//           }
//           break;
//         }
// 
//         default: {
//           throw new Error('property type shoud be string, integer, number, boolean');
//         }
//       }
// 
//       keyValue = {
//         ...keyValue,
//         [key]: val,
//       };
//     }
// 
//     if (!validate(schema, keyValue)) {
//       // @ts-ignore
//       const { errors } = validate;
//       console.debug(errors);
//       return new JsonSchemaError(errors.propertyName, errors.data, errors, errors.message);
//     }
// 
//     return keyValue as any; // TODO as!
//   }
// }
// 
// export class JsonSchemaError extends HandleableError {
//   override readonly name = 'lib.jsonSchema.JsonSchemaError' as const;
//   constructor(
//     readonly property_name: string,
//     readonly value: string,
//     readonly error: Error,
//     readonly message: string,
//   ) {
//     super();
//   }
// }
