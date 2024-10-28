import {Component} from 'solid-js';
import {Documentation} from './Documentation.jsx';
import {FaBrandsGithub} from 'solid-icons/fa';

export const Footer: Component = () => {
  return <>
    <footer class="w-screen flex flex-row items-center h-full px-4 justify-center text-white">
      <Documentation/>
      <span class="mr-4 text-gray-600">By Andreas Schoch</span>
      <a class="text-2xl cursor-pointer" rel="noopener" href='https://github.com/andreas-schoch/dominoscript' target="_blank"><FaBrandsGithub/></a>
    </footer>
  </>;
};
