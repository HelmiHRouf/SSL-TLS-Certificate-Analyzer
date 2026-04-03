"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle, X } from "lucide-react";

interface LearnTooltipProps {
  title: string;
  description: string;
  link?: string;
  linkText?: string;
}

export function LearnTooltip({
  title,
  description,
  link,
  linkText = "Learn more",
}: LearnTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="ml-2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label={`Learn about ${title}`}
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close on click outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Tooltip popup */}
          <div className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 w-72 p-4 bg-white rounded-lg shadow-lg border border-gray-200 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-start justify-between">
              <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
              <button
                onClick={() => setIsOpen(false)}
                className="p-0.5 rounded hover:bg-gray-100 -mr-1 -mt-1"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
              {description}
            </p>
            {link && (
              <Link
                href={link}
                className="inline-flex items-center text-sm font-medium text-learn hover:text-learn/80 mt-2"
              >
                {linkText}
                <svg className="ml-1 w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}