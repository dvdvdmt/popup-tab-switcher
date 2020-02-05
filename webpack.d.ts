declare const E2E: boolean;
declare const PRODUCTION: boolean;

interface SvgSymbol {
  viewBox: string;
  id: string;
}
declare module '*.svg' {
  const content: SvgSymbol;
  export default content;
}

declare module '*popup-tab-switcher.scss' {
  const content: string;
  export default content;
}
