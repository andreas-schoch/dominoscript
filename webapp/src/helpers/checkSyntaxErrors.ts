import {sourceToGrid} from 'dominoscript/dist/serializer.js';

export function checkSyntaxErrors(source: string): string {
  let error = '';
  try {
    sourceToGrid(source);
  } catch (e) {
    error = e.name + ': ' + e.message;
  }
  return error;
}
