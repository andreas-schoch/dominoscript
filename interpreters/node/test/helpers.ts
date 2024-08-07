export function dedent(str: string) {
  // Remove indentation that is not part of a DominoScript string
  // Only to be used for test strings.
  const lines = str.split('\n');
  const match = lines[0].match(/^ */);
  const indent = match ? match[0].length : 0;
  const dedentedLines = lines.map(line => line.slice(indent));
  return dedentedLines.join('\n');
}
