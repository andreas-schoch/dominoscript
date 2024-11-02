/* @refresh reload */
import './index.css';
import {App} from './app.jsx';
import {createSignal} from 'solid-js';
import {filenameExamples} from './helpers/fetchExamples.js';
import {render} from 'solid-js/web';

export const [exampleName, setExampleName] = createSignal(filenameExamples[0]);
export const [isRunning, setIsRunning] = createSignal(false);

const root = document.getElementById('root');
if (import.meta.env.DEV && !(root instanceof HTMLElement)) throw new Error('Root element not found');

render(() => <App/>, root);
