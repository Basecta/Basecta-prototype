'use client';

import { useState } from 'react';
import Link from 'next/link';

export interface NavMenuItem {
  label: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
}

interface NavbarProps {
  title: string;
  backHref?: string;
  menuItems?: NavMenuItem[];
}

export function Navbar({ title, backHref, menuItems }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
        {/* Left: optional back arrow + title */}
        <div className="flex items-center gap-4">
          {backHref && (
            <Link
              href={backHref}
              className="text-gray-600 hover:text-gray-800 transition-colors"
              aria-label="Go back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          )}
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        </div>

        {/* Right: burger menu */}
        {menuItems && menuItems.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-md hover:bg-gray-200 hover:shadow-md transition-all cursor-pointer transform hover:scale-105"
              aria-label="Menu"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 py-1">
                  {menuItems.map((item, i) =>
                    item.href ? (
                      <Link
                        key={i}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={`block px-4 py-2 transition-colors hover:bg-gray-100 ${
                          item.danger ? 'text-red-600' : 'text-gray-700'
                        }`}
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <button
                        key={i}
                        onClick={() => { item.onClick?.(); setMenuOpen(false); }}
                        className={`w-full text-left px-4 py-2 transition-colors hover:bg-gray-100 cursor-pointer ${
                          item.danger ? 'text-red-600' : 'text-gray-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
