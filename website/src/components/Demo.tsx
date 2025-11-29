export function Demo() {
  return (
    <section className="bg-slate-50 py-24 dark:bg-slate-800 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            See it in action
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400">
            Edit Markdown with blocks. Type <code className="rounded bg-slate-200 px-1.5 py-0.5 text-sm font-mono dark:bg-slate-700">/</code> to add content.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          {/* Editor mockup */}
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
              {/* Heading block */}
              <div className="group relative mb-6 flex items-start">
                <div className="absolute -left-8 top-1 cursor-grab opacity-0 transition group-hover:opacity-100">
                  <svg className="h-5 w-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                  </svg>
                </div>
                <h1 className="text-3xl font-bold">Welcome to SlashMD</h1>
              </div>

              {/* Paragraph block */}
              <div className="group relative mb-6 flex items-start">
                <div className="absolute -left-8 top-1 cursor-grab opacity-0 transition group-hover:opacity-100">
                  <svg className="h-5 w-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                  </svg>
                </div>
                <p className="text-slate-300">
                  A beautiful block-based editor for your Markdown files.
                  Everything stays as <span className="text-sky-400">plain Markdown</span> on disk.
                </p>
              </div>

              {/* Callout block */}
              <div className="group relative mb-6 flex items-start">
                <div className="absolute -left-8 top-3 cursor-grab opacity-0 transition group-hover:opacity-100">
                  <svg className="h-5 w-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                  </svg>
                </div>
                <div className="flex w-full rounded-lg border-l-4 border-sky-500 bg-sky-500/10 p-4">
                  <span className="mr-3 text-xl">💡</span>
                  <div>
                    <p className="font-semibold text-sky-400">Tip</p>
                    <p className="text-slate-300">Type <code className="rounded bg-slate-700 px-1 text-sm">/</code> to see available blocks</p>
                  </div>
                </div>
              </div>

              {/* Code block */}
              <div className="group relative mb-6 flex items-start">
                <div className="absolute -left-8 top-3 cursor-grab opacity-0 transition group-hover:opacity-100">
                  <svg className="h-5 w-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                  </svg>
                </div>
                <div className="w-full overflow-hidden rounded-lg bg-slate-800 ring-1 ring-slate-700">
                  <div className="flex items-center justify-between border-b border-slate-700 px-4 py-2">
                    <span className="text-xs text-slate-500">typescript</span>
                  </div>
                  <pre className="p-4 text-sm">
                    <code>
                      <span className="text-purple-400">const</span>{' '}
                      <span className="text-sky-400">greeting</span>{' '}
                      <span className="text-slate-400">=</span>{' '}
                      <span className="text-green-400">&quot;Hello, SlashMD!&quot;</span>
                      <span className="text-slate-400">;</span>
                    </code>
                  </pre>
                </div>
              </div>

              {/* Slash command preview */}
              <div className="relative">
                <div className="flex items-center text-slate-500">
                  <span className="mr-2">/</span>
                  <span className="animate-pulse">|</span>
                </div>
                <div className="absolute left-0 top-8 w-64 overflow-hidden rounded-lg bg-slate-800 shadow-xl ring-1 ring-slate-700">
                  <div className="p-2">
                    <div className="flex items-center rounded-md bg-sky-600/20 p-2">
                      <span className="mr-3 text-lg">📝</span>
                      <div>
                        <p className="text-sm font-medium text-white">Paragraph</p>
                        <p className="text-xs text-slate-400">Plain text block</p>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center rounded-md p-2 hover:bg-slate-700">
                      <span className="mr-3 text-lg">📌</span>
                      <div>
                        <p className="text-sm font-medium text-white">Heading 1</p>
                        <p className="text-xs text-slate-400">Large section heading</p>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center rounded-md p-2 hover:bg-slate-700">
                      <span className="mr-3 text-lg">💻</span>
                      <div>
                        <p className="text-sm font-medium text-white">Code Block</p>
                        <p className="text-xs text-slate-400">Syntax highlighted code</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
