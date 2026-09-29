---
name: building-client-plugins
description: "Builds personal plugins that run in the Amp web, iOS, and macOS apps. Use when customizing the client UI, sidebar orb colors, or client-side behavior with Jev. Not for executor plugins."
metadata:
  feature: client-plugins
---

# Building Client Plugins

Build personal customizations for the Amp web, iOS, and macOS apps. These plugins run in the
signed-in user's page, not in the executor. They have DOM and authenticated network access,
including any native bridge the app exposes. They are not sandboxed. Review the entire bundle
as code trusted with the user's account. Avoid remote executable dependencies.

This is a separate API from executor plugins. Do not use `@ampcode/plugin`, `load_plugin`,
`reload_plugins`, or `.amp/plugins/` to install client plugins.

## Author and publish

1. Run `amp plugins repositories` and select the writable User Plugins repository. Workspace
   plugins are not loaded by the client. A scope with no plugins yet is simply empty.
2. Work in `~/.cache/amp/repositories/<host>-user-plugins`, using the host from the clone URL.
   Reuse an existing clone without discarding local work. Otherwise use the printed `amp clone`
   command with this destination. If the repo does not exist yet, initialize that directory with
   Git, configure `git config credential.helper '!amp git-credential-helper'`, and add the printed
   clone URL as `origin`. The first push creates the repository.
3. Read any existing `client/index.mjs` and its source before editing. There is one client plugin
   entrypoint per user, so preserve existing customizations when adding behavior.
4. Write browser-ready JavaScript to `client/index.mjs`. Build and test in the orb or runner.
   Use the API below, not the executor Plugin API.
5. Commit the source and output together. Push to the personal repo's default branch only with
   the user's authorization. Publishing changes what their signed-in clients execute.
6. After publishing, have the user reload the app. Report the repository and whether the code
   was only prepared locally or published. No server deployment or client plugin reload tool
   is needed.

Amp serves `client/index.mjs` unchanged. It must be a single self-contained ES module of at most
2 MiB with the default export shown below. Plain JavaScript needs no build. If you use TypeScript
or dependencies, build and test the bundle in your orb or runner before publishing it. Keep the
source in `client/src/`, for example `client/src/main.ts`. Do not put browser code in
`client/index.ts` or `client/index.js`: those are executor plugin entrypoints. Preserve any existing
executor plugin there. Target Safari 17 or newer for the iOS and macOS webviews.

Amp does not compile code, install packages, or run build scripts on the server. It does not serve
other repo files as module imports or assets. Bundle dependencies into `client/index.mjs`, and
include any CSS as JavaScript that inserts a style element rather than as a separate CSS file.
Relative imports and asset URLs resolve against the delivery endpoint, not the repo.

## Reload and recover

Reload the app to load a new revision. Each page executes its own copy, including the separate
iOS sidebar webview. The macOS app uses the shared app page. There is no live replacement.
Every activation uses a fresh module URL to recheck authorization rather than reuse the browser's
module cache. Pages that loaded plugins reload when restored from the browser's back/forward cache.
Signed-commit policy applies. Amp does not validate JavaScript syntax or keep a last working bundle.
Syntax and runtime errors are logged in the browser and do not roll back the bundle. Publish a
corrected bundle or revert the bad commit to recover. Removing `client/index.mjs` stops delivery on
the next load. A repo containing only TypeScript does not load a client plugin.

Open an app page with `?client-plugins=off` to skip loading plugins. This persists in that client's
local storage. Use `?client-plugins=on` to restore loading. Removing arbitrary DOM changes or
stopping a plugin that blocks JavaScript requires a fresh page load. Server access checks apply
to both delivery and Jev calls, but cannot undo code already running in a page.

## API contract

The default export receives API version 1. It may be async and may return a cleanup function.
Keep the published file as JavaScript; these TypeScript types describe the contract.

```ts
interface ClientPluginThread {
	id: string
	title: string
	project: string | null
	agentMode: string | null
	isRunning: boolean
	hasError: boolean
	isUnread: boolean
}

type OrbColor = 'blue' | 'purple' | 'pink' | 'red' | 'orange' | 'yellow' | 'green' | 'cyan'
type OrbColorRule = (thread: ClientPluginThread) => string | null | Promise<string | null>

interface ClientPluginAPI {
	version: 1
	sidebar: {
		readonly orbColors: readonly OrbColor[]
		setOrbColorRule(rule: OrbColorRule): () => void
	}
	jev(request: JevRequest): Promise<JevResponse>
}
```

## Change displayed orb colors

For a deterministic rule, publish this as `client/index.mjs`:

```js
export default function (amp) {
	return amp.sidebar.setOrbColorRule((thread) => (thread.isRunning ? '#00ccaa' : '#ff8800'))
}
```

`setOrbColorRule` replaces the current display rule. It does not add a picker option or change
saved thread colors. Its return value unregisters that rule. The rule receives a snapshot with
`id`, `title`, `project`, `agentMode`, `isRunning`, `hasError`, and `isUnread`. It runs again when
those inputs change. It may return a named Amp color, a six-digit hex color, or `null` to preserve
the normal color. Async rules work too. Amp uses its normal color while waiting and after an error,
and ignores answers for an outdated snapshot.

`amp.sidebar.orbColors` is a frozen array of the default picker color names, taken from Amp's
palette. Currently it contains `blue`, `purple`, `pink`, `red`, `orange`, `yellow`, `green`, and
`cyan`. Return one of those names to use Amp's rendering of that color, or give the array to Jev
as its choices. For example, this assigns palette colors by title length:

```js
export default function (amp) {
	const colors = amp.sidebar.orbColors
	return amp.sidebar.setOrbColorRule((thread) => colors[thread.title.length % colors.length])
}
```

## Use Jev

`amp.jev({ state, questions })` calls Jev through Amp without exposing a provider key. The model
is `jev-latest`. Use this method instead of calling the provider directly or storing a provider
key in a plugin. Requests support `noul`, `score`, and `choice` questions.

This example classifies a thread's title, then chooses a color locally:

```js
export default function (amp) {
	return amp.sidebar.setOrbColorRule(async (thread) => {
		const { answers } = await amp.jev({
			state: { title: thread.title },
			questions: {
				kind: {
					type: 'choice',
					instructions: 'Classify the work described by this thread title.',
					criteria: {
						bug: 'Diagnosing or fixing a defect.',
						feature: 'Adding or changing product behavior.',
						other: 'Work that fits neither category.',
					},
				},
			},
		})
		const answer = answers.kind
		if (answer?.type !== 'choice') return null
		return { bug: '#ff8800', feature: '#00ccaa', other: null }[answer.choice] ?? null
	})
}
```

Identical requests share a cached promise for one plugin activation, up to 200 entries. Each user
can make 20 requests per minute across devices. A request may contain up to 20 questions and 64 KiB
of JSON, and times out after 20 seconds. Large sidebars should batch classification or limit which
threads they classify. Failed rules fall back to the normal orb color. Handle rejected Jev calls
if your plugin uses them outside an orb-color rule. The service can be temporarily unavailable;
do not request a provider key from the user as a workaround.

### Jev request and response types

```ts
type JevText = string | Record<string, unknown> | unknown[]

type JevQuestion =
	| { type: 'noul'; instructions: JevText; criteria?: { true?: JevText; false?: JevText } }
	| { type: 'score'; instructions: JevText; criteria: JevText[] }
	| { type: 'choice'; instructions: JevText; criteria: Record<string, JevText | null> }

interface JevRequest {
	state: JevText
	questions: Record<string, JevQuestion>
}

type JevAnswer =
	| { type: 'noul'; noul: number }
	| {
			type: 'score'
			score: number
			legend: Record<string, string>
			probabilities: Record<string, number>
			confidence: number
	  }
	| {
			type: 'choice'
			choice: string
			probabilities: Record<string, number>
			confidence: number
	  }

interface JevResponse {
	answers: Record<string, JevAnswer>
}
```

Use JSON-serializable state and question values. A string state has a limit of 50,000 characters.
String instructions and criteria have a limit of 10,000 characters each. Question names and choice
keys must contain 1 to 100 characters. Include 1 to 20 questions. Score criteria need 2 to 10
entries, and choice criteria need 2 to 20 entries. Requests and question objects reject fields
outside this contract. Check each returned answer's `type` before using it.

## Verify before publishing

Test deterministic rules with different thread states, including the normal-color fallback.
For async rules, test rejection and a thread changing while a response is pending. Verify that
cleanup unregisters the rule. Test Jev requests with mocked responses first, then distinguish
mocked checks from live inference when reporting results. When client testing is available,
reload and confirm the published behavior, then exercise the local disable switch. Never import
an unrestricted plugin into the server or executor merely to test browser behavior.
