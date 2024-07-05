// export abstract class HandleableError extends Error {
// 
//   constructor() {
//     super();
//   }
// 
//   // @ts-ignore
//   toJson() {
//     return Object.entries(this).reduce((acc, [key, val]) => {
// 
//       if (!Object.hasOwn(this, key)) {
//         return acc;
//       }
// 
//       if (val instanceof HandleableError) {
//         return {
//           ...acc,
//           [key]: val.toJson(),
//         };
//       }
// 
//       if (val instanceof Error) {
//         return {
//           ...acc,
//           [key]: val.message,
//         };
//       }
// 
//       return {
//         ...acc,
//         [key]: val,
//       };
//     });
//   }
// 
//   eq(arg: any): arg is this {
//     if (!arg) {
//       return false;
//     }
//     if (typeof arg !== 'object') {
//       return false;
//     }
//     return this.name === arg.name;
//   }
// }
// 
// export function eq<E extends HandleableError>(error: E, value: any): value is E {
//   if (!value) {
//     return false;
//   }
//   if (typeof value !== 'object') {
//     return false;
//   }
//   return error.name === value.name;
// }
