import {Context, contexts} from './Context.js';
import {DSInterpreterError} from './errors.js';

// Remove indentation that is not part of a DominoScript string
export function dedent(str: string): string {
  const lines = str.split('\n');
  const match = lines[0].match(/^ */);
  /* c8 ignore next */
  if (!match) throw new DSInterpreterError('dedent match is null. This should never happen with the way we use it.');
  const indent = match[0].length;
  const dedentedLines = lines.map(line => line.slice(indent));
  return dedentedLines.join('\n');
}

export function getTotalInfo(ctxId: Context['id'], infos: Context['info'][] = []): Context['info'] {
  const ctx = contexts[ctxId];
  infos.push(ctx.info);

  for (const childCtxId of ctx.children) getTotalInfo(childCtxId, infos);

  if (!ctx.parent) {
    const globalInfo: Context['info'] = {
      timeStartMs: ctx.info.timeStartMs,
      timeEndMs: ctx.info.timeEndMs,
      executionTimeMS: ctx.info.executionTimeMS,
      totalInstructions: 0,
      totalSteps: 0,
      totalJumps: 0,
      totalCalls: 0,
      totalReturns: 0,
      totalImports: 0,
      totalInstructionExecution: {}
    };

    for (const info of infos) {
      globalInfo.totalInstructions += info.totalInstructions;
      globalInfo.totalSteps += info.totalSteps;
      globalInfo.totalJumps += info.totalJumps;
      globalInfo.totalCalls += info.totalCalls;
      globalInfo.totalReturns += info.totalReturns;
      globalInfo.totalImports += info.totalImports;

      for (const [instruction, count] of Object.entries(info.totalInstructionExecution)) {
        globalInfo.totalInstructionExecution[instruction] = (globalInfo.totalInstructionExecution[instruction] || 0) + count;
      }
    }

    return globalInfo;
  }

  return ctx.info;
}
