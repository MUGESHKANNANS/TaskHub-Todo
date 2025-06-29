"use client";

import React from 'react';
import { Code2 } from 'lucide-react';

export function MugeshFooter() {
  return (
    <div className="bottom-0 left-0 right-0 flex justify-center items-center group mt-12 mb-4">
      <footer className="opacity-70 group-hover:opacity-100 inline-block px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-xl shadow-lg z-50 transition-all duration-300 bg-card/50 backdrop-blur-md border border-pink-500 text-foreground/90 max-w-full sm:max-w-md md:max-w-lg lg:max-w-xl">
        <div className="group flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm font-body">
          <span className="animate-bounce group-hover:animate-none text-primary group-hover:text-pink-500 duration-300 text-sm sm:text-base">
            <Code2 size={18} />
          </span>
          <p className="text-center whitespace-nowrap">
            Coded with care by{' '}
            <a
              href="https://mugeshkannan.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-pink-500 group-hover:text-pink-500 transition-all duration-200 underline underline-offset-4"
            >
              Mugesh Kannan S
            </a>{' '}
            • {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}