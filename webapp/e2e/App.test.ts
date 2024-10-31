import {expect, test} from './baseFixtures';

test.beforeEach(async ({page}) => {
  await page.goto('/');
});

test('initial state', async ({page}) => {
  expect(await page.title()).toBe('DominoScript Playground');
  expect(await page.locator('#Instructions').isChecked());
  expect(await page.locator('#Summary').isChecked());
  expect(await page.locator('#split-left .cm-editor').isVisible);
  expect(await page.locator('#split-top .xtermjs').isVisible);
  expect(await page.locator('#split-bottom .xtermjs').isVisible);
});

test('run intro script', async ({page}) => {
  await page.click('text=Red');
  await page.getByTestId('run').click();
  const terminal = await page.getByTestId('terminal-output').first();
  console.log('----terminal', terminal.isVisible);
  const rows = await terminal.locator('#split-top .xterm-rows > div > span').all();
  console.log('---rows', rows.length);
  expect(rows.length).toBeGreaterThan(0);
  // output.evaluateHandle('document');
  // const terminalHandle = await page.evaluateHandle('document'); // Handle for the 'document'
  // strictEqual(await page.evaluate('document.querySelector(\'#terminal-container\').children.length'), 0, 'there must be no terminals on the page');

});
