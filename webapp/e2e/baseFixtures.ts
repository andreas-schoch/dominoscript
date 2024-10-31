import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import {test as baseTest} from '@playwright/test';

// Taken from https://github.com/mxschmitt/playwright-test-coverage
//  TODO Didn't take the time to understand it enough to make it work using the inbuilt playwright coverage feature
//  I'd prefer to make it work with inbuilt `page.coverage.startJSCoverage()` instead of vite-plugin-istanbul

const istanbulCLIOutput = path.join(process.cwd(), '.nyc_output');

export function generateUUID(): string {
  return crypto.randomBytes(16).toString('hex');
}

export const test = baseTest.extend({
  context: async ({context}, use) => {

    await context.addInitScript(() =>
      window.addEventListener('beforeunload', () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).collectIstanbulCoverage(JSON.stringify((window as any).__coverage__))
      ),
    );

    await fs.promises.mkdir(istanbulCLIOutput, {recursive: true});
    await context.exposeFunction('collectIstanbulCoverage', (coverageJSON: string) => {
      if (coverageJSON) fs.writeFileSync(path.join(istanbulCLIOutput, `playwright_coverage_${generateUUID()}.json`), coverageJSON);
    });
    await use(context);
    for (const page of context.pages()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await page.evaluate(() => (window as any).collectIstanbulCoverage(JSON.stringify((window as any).__coverage__)));
    }
  }
});

export const expect = test.expect;
