'use client';

import dynamic from 'next/dynamic';

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

            {/* Editor content */}
            <div className="p-8 font-sans text-slate-100">
              <DemoEditor />
            </div>
          </div>

          {/* Hint text */}
          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Try it! Click to edit, press{' '}
            <kbd className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-700">
              /
            </kbd>{' '}
            for block types,{' '}
            <kbd className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-700">
              Enter
            </kbd>{' '}
            for new lines
          </p>
        </div>
      </div>
    </section>
  );
}
