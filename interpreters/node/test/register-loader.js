import {pathToFileURL} from 'node:url';
import {register} from 'node:module';

// Gets rid of the following warning when running tests:
// ExperimentalWarning: `--experimental-loader` may be removed in the future; instead use `register()`
register('ts-node/esm', pathToFileURL('./'));
