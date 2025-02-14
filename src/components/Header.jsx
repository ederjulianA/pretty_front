// src/components/Header.js
import React from 'react';

const Header = ({ title }) => (
  <header className="bg-[#f58ea3] shadow-md p-4 flex items-center justify-between rounded-md cursor-pointer">
    <h1 className="text-xl font-bold text-white">{title}</h1>
  </header>
);

export default Header;
