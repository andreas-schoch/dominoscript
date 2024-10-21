/* @refresh reload */
import './index.css';
import {App} from './app.jsx';

import {render} from 'solid-js/web';

const root = document.getElementById('root');
if (import.meta.env.DEV && !(root instanceof HTMLElement)) throw new Error('Root element not found');

render(() => <App/>, root);
