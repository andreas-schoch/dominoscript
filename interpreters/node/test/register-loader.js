import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Gets rid of the following warning when running tests:
// ExperimentalWarning: `--experimental-loader` may be removed in the future; instead use `register()`
register('ts-node/esm', pathToFileURL('./'));
