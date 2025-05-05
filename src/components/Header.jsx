// src/components/Header.js
import React from 'react';
import { FaShoppingBag } from 'react-icons/fa';

const Header = ({ title }) => (
  <div className="bg-gradient-to-r from-[#f58ea3] to-[#f7b3c2] shadow flex items-center justify-between px-4 py-2 rounded-xl mb-2 w-full md:max-w-none md:mx-0 md:rounded-none md:mb-0">
    <div className="flex items-center gap-2">
      <FaShoppingBag className="w-6 h-6 text-white" />
      <span className="font-bold text-lg text-white">Pedidos Pretty</span>
    </div>
    <span className="bg-white/30 text-white text-xs px-2 py-1 rounded-lg font-medium ml-2 whitespace-nowrap">Sistema de Ventas</span>
  </div>
);

export default Header;
