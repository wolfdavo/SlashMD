'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { initialContent } from './editor/DemoEditor';

const DemoEditor = dynamic(
  () => import('./editor/DemoEditor').then((mod) => mod.DemoEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[400px] animate-pulse rounded-lg bg-slate-800" />
    ),
  }
);

export function Demo() {
  const [isSlashMD, setIsSlashMD] = useState(true);
  const [markdown, setMarkdown] = useState(initialContent);
  const [lastExternalUpdate, setLastExternalUpdate] = useState(0);
  const markdownWhenSwitchedToRaw = useRef(markdown);
  const rawModeEdited = useRef(false);

  // Handle changes from the Lexical editor
  const handleEditorChange = useCallback((newMarkdown: string) => {
    setMarkdown(newMarkdown);
  }, []);

  // Handle changes from the raw textarea
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMarkdown(e.target.value);
    rawModeEdited.current = true;
  }, []);

  // When switching to raw mode, save the current markdown
  const handleSwitchToRaw = useCallback(() => {
    markdownWhenSwitchedToRaw.current = markdown;
    rawModeEdited.current = false;
    setIsSlashMD(false);
  }, [markdown]);

  // When switching to SlashMD mode, only trigger update if content actually changed
  const handleSwitchToSlashMD = useCallback(() => {
    if (!isSlashMD && rawModeEdited.current && markdown !== markdownWhenSwitchedToRaw.current) {
      // Content was actually edited in raw mode, trigger re-import
      setLastExternalUpdate(Date.now());
    }
    rawModeEdited.current = false;
    setIsSlashMD(true);
  }, [isSlashMD, markdown]);

  return (
    <section className="bg-slate-50 py-24 dark:bg-slate-800 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            See it in action
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400">
            Edit Markdown with blocks. Type{' '}
            <code className="rounded bg-slate-200 px-1.5 py-0.5 text-sm font-mono dark:bg-slate-700">
              /
            </code>{' '}
            to add content.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          {/* Toggle */}
          <div className="mb-4 flex justify-center">
            <div className="relative inline-flex items-center rounded-full bg-slate-200 p-1 dark:bg-slate-700">
              {/* Sliding background */}
              <div
                className={`absolute h-8 w-28 rounded-full bg-white shadow-md transition-transform duration-300 ease-out dark:bg-slate-900 ${
                  isSlashMD ? 'translate-x-0' : 'translate-x-28'
                }`}
              />

              <button
                onClick={handleSwitchToSlashMD}
                className={`relative z-10 flex h-8 w-28 items-center justify-center rounded-full text-sm font-medium transition-colors duration-200 ${
                  isSlashMD
                    ? 'text-sky-600 dark:text-sky-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                SlashMD
              </button>
              <button
                onClick={handleSwitchToRaw}
                className={`relative z-10 flex h-8 w-28 items-center justify-center rounded-full text-sm font-medium transition-colors duration-200 ${
                  !isSlashMD
                    ? 'text-sky-600 dark:text-sky-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                Raw Markdown
              </button>
            </div>
          </div>

          {/* Editor */}
          <div className="overflow-hidden rounded-2xl bg-slate-900 shadow-2xl ring-1 ring-white/10">
            {/* Window chrome */}
            <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-800 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-1 text-center">
                <span className="text-sm text-slate-400">README.md — SlashMD</span>
              </div>
            </div>

            {/* Editor content with crossfade animation */}
            <div className="relative">
              {/* SlashMD Editor - always in flow to set container height */}
              <div
                className={`min-h-[400px] p-8 font-sans text-slate-100 transition-opacity duration-300 ${
                  isSlashMD ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
              >
                <DemoEditor
                  onMarkdownChange={handleEditorChange}
                  externalMarkdown={markdown}
                  lastExternalUpdate={lastExternalUpdate}
                />
              </div>

              {/* Raw Markdown - absolute positioned to overlay */}
              <div
                className={`absolute inset-0 flex transition-opacity duration-300 ${
                  isSlashMD ? 'pointer-events-none opacity-0' : 'opacity-100'
                }`}
              >
                <textarea
                  className="flex-1 resize-none bg-transparent p-8 font-mono text-sm leading-relaxed text-slate-300 outline-none"
                  value={markdown}
                  onChange={handleTextareaChange}
                  spellCheck={false}
                />
              </div>
            </div>
          </div>

          {/* Hint text */}
          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            {isSlashMD ? (
              <>
                Try it! Click to edit, press{' '}
                <kbd className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-700">
                  /
                </kbd>{' '}
                for block types,{' '}
                <kbd className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-700">
                  Enter
                </kbd>{' '}
                for new lines
              </>
            ) : (
              <>
                Edit the raw Markdown here. Changes sync when you switch back to SlashMD view.
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
