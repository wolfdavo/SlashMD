export function Install() {
  return (
    <section className="bg-white py-24 dark:bg-slate-900 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Get started in seconds
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400">
            Install SlashMD from the VS Code Marketplace or search for it directly in your editor.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-3xl">
          <div className="grid gap-8 sm:grid-cols-2">
            {/* VS Code */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                  <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">VS Code</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Official marketplace</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
                  Search in the Extensions panel:
                </p>
                <code className="block rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-800 dark:bg-slate-900 dark:text-slate-200">
                  ext install slashmd.slashmd
                </code>
              </div>

              <a
                href="https://marketplace.visualstudio.com/items?itemName=slashmd.slashmd"
                className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Open in VS Code Marketplace
              </a>
            </div>

            {/* Cursor */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600">
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Cursor</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">AI-powered editor</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
                  Search in Extensions or install VSIX:
                </p>
                <code className="block rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-800 dark:bg-slate-900 dark:text-slate-200">
                  SlashMD
                </code>
              </div>

              <a
                href="https://github.com/wolfdavo/SlashMD/releases"
                className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Download VSIX
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
