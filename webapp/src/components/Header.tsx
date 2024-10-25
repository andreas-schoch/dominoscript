import {Component} from 'solid-js';
import logo from '../../assets/logo.png';

export const Header: Component = () => {
  return <>
    <header class="w-screen flex flex-col items-center px-4 pt-2 h-full">
      <div class="flex flex-row justify-center items-stretch h-full">
        <img src={logo} alt="logo" class="h-7 mr-4 sm:h-9" />
        <h1 class="text-xl text-white font-bold sm:text-3xl">DominoScript Playground</h1>
      </div>
      <div class="text-[12px] text-gray-600">A recreational stack-oriented concatenative 2D self-modifying esoteric programming language that uses dots on dominos to represent code.</div>
    </header>
  </>;
};
