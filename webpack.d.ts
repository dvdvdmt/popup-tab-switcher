declare const E2E: boolean
declare const DEVELOPMENT: boolean
declare const PRODUCTION: boolean

// TODO: How to specify the result of an imported a module only in settings?
// interface SvgSymbol {
//   viewBox: string;
//   id: string;
// }
// declare module '*.svg' {
//   const content: SvgSymbol;
//   export default content;
// }

declare module '*.svg' {
  const content: string
  export default content
}

declare module '*.scss' {
  const content: string
  export default content
}
