// Declare the interface for options used in renderAsync
export interface RenderOptions {
  viewsPath?: string; // optional path to views directory
  jobjects?: Array<JObjectFile>; // optional array of jobjects
}

// Declare the interface for the jobject files that are read
export interface JObjectFile {
  path: string;
  code: string;
}

// Define the callback function type
export type RenderCallback = (error: Error | null, result?: string) => void;

// Declare the renderAsync function
export function renderAsync(
  viewPath: string, 
  options: RenderOptions, 
  callback: RenderCallback
): Promise<void>;

// Declare the webbrRenderAsync function
export function webbrRenderAsync(
  code: string
): Promise<string>;
