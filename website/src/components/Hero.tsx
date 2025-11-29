export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

      <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 flex justify-center">
            <span className="inline-flex items-center rounded-full bg-sky-500/10 px-4 py-1.5 text-sm font-medium text-sky-400 ring-1 ring-inset ring-sky-500/20">
              Now available for VS Code & Cursor
            </span>
          </div>

          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
            <span className="bg-gradient-to-r from-white via-sky-200 to-sky-400 bg-clip-text text-transparent">
              SlashMD
            </span>
          </h1>

          <p className="mt-4 text-2xl font-medium text-slate-300 sm:text-3xl">
            Block-Based Markdown Editing
          </p>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            A Notion-like WYSIWYG editor for your Markdown files.
            Use slash commands, drag blocks, and see your content beautifully rendered —
            all while keeping plain Markdown on disk.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <a
              href="https://marketplace.visualstudio.com/items?itemName=slashmd.slashmd"
              className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 hover:shadow-sky-400/30"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/>
              </svg>
              Install for VS Code
            </a>

            <a
              href="https://github.com/wolfdavo/SlashMD"
              className="inline-flex items-center justify-center rounded-lg border border-slate-600 bg-slate-800/50 px-6 py-3 text-base font-semibold text-white transition hover:border-slate-500 hover:bg-slate-700/50"
            >
              <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
      </div>

      {/* Gradient fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent dark:from-slate-900"></div>
    </section>
  )
}
