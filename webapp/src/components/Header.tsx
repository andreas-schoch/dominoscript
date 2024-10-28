import {Documentation} from './Documentation.jsx';
import {FaBrandsGithub} from 'solid-icons/fa';
import {ParentComponent} from 'solid-js';
import logo from '../../assets/logo.png';

export const Header: ParentComponent = props => {
  return <>
    <header class="w-screen bg-stone-900 border-b items-center border-stone-500 text-white grid grid-cols-3">

      <div class="flex flex-row h-full items-center">
        <div class="ml-2.5 mr-4 size-10 cursor-pointer rounded-full border border-stone-600 bg-stone-800 hover:bg-stone-700 min-h-10 min-w-10">
          <img src={logo} alt="logo" class="size-full hover:scale-105" />
        </div>
        <h1 class="text-lg font">DominoScript</h1>
      </div>

      <div class="flex flex-row h-full py-3 items-center justify-center">
        {props.children}
      </div>

      <div class="flex flex-row h-full items-center justify-end">
        <Documentation/>
        <a class="w-10 h-10 flex justify-center items-center cursor-pointer text-2xl mr-2.5 rounded hover:bg-stone-800" rel="noopener" href='https://github.com/andreas-schoch/dominoscript' target="_blank"><FaBrandsGithub/></a>
      </div>
    </header>
  </>;
};
