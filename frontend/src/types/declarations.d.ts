declare module "xlsx/xlsx.mjs" {
  export const utils: any;
  export function read(data: any, opts?: any): any;
  export function write(data: any, opts?: any): any;
  export function writeFile(data: any, filename: string, opts?: any): any;
}

declare module "mammoth/mammoth.browser" {
  export function convertToHtml(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string; messages: any[] }>;
  export function convertToMarkdown(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string; messages: any[] }>;
  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string; messages: any[] }>;
}

declare module "pdfjs-dist/build/pdf" {
  export * from "pdfjs-dist";
}
