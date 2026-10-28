---
name: explaining-code
description: 'Explains code, system behavior, and code changes with plain technical prose, interactive before and after diagrams, pseudocode, call trees, and diffs. Use for architecture walkthroughs, when asked how something works, or when explaining what a change does: a diff, a commit, a pull request, or the work just done in this thread.'
---

# Explaining code

Help the user understand how code or a system works, or what a change does. Lead with the behavior
in plain technical prose. Name the functions, components, data, APIs, and ownership boundaries that
matter. Define a technical term when the user may not know it. Keep necessary detail, but cut
preamble and filler.

## Choosing the level

A system has levels, and each level has its own vocabulary. Orchestration code talks about
requests, jobs, sessions, and who hands work to whom. Plumbing code talks about fields, payloads,
and parsers. Systems code talks about buffers, pointers, locks, and lifetimes. Pick one level and
use its nouns and verbs in the lead sentence and the drawing.

- For a question about how something works, use the level the question asks about. "How does
  sign-in work?" is answered in sessions, redirects, and tokens, not in the cookie parser.
- For a change, use the level of the code it changes. A fix in orchestration code is explained as
  what its parts now do together. A fix to memory handling is explained in buffers, owners, and
  lifetimes.
- Go one level lower only for the mechanism the reader needs to trust the explanation, in one
  sentence after it. Go further down only when the reader asks.

After the first sentence, the reader should be able to say what behaves differently, in the terms
of the code that changed.

Example of an orchestration fix:

- Too low: "`enqueue()` now writes `deadlineMs` instead of `deadline`; the worker's schema strips
  unknown keys."
- At its level: "Child jobs now inherit their parent's deadline, so cancelling an export stops all
  of its page renders. The deadline was sent under a field name the worker ignored."

Example of a memory fix:

- Too high: "Fixed a crash when closing a tab."
- At its level: "The tab's frame buffer is now freed by the renderer after its last frame callback
  instead of by the tab on close; the callback was reading freed memory."

## Explaining how something works

Use the smallest view that makes the explanation easier to follow, or prose alone when prose is
clearer:

- Logic or an algorithm → pseudocode
- Runtime order → call tree
- UI ownership → component tree with relevant state and module boundaries
- File ownership → shallow file tree
- Interaction, data flow, states, or architecture → a diagram, drawn as a view (see Diagrams)

## Diagrams

Draw every diagram as an `amp-view` block: load the `creating-views` skill and follow its
diagram reference. Draw the decisive path, state, or transition in `--chart-1` and the rest in
gray, so the eye lands on it first.

When `creating-views` is not in your skill list, the client cannot render views (the CLI shows
their HTML as code). Draw no diagram then; use the call tree, component tree, file tree,
pseudocode, or structural `diff` from "Other useful views", which read clearly everywhere.

## Explaining a change

A change is anything that makes the code behave differently than it did: a diff, a commit, a pull
request, a fix, a proposal, or the work just done in this thread. Show a change in a diagram by
default, or in a structural `diff` when you cannot draw views. The reader then sees what is
different at a glance; prose alone makes them rebuild both versions in their head.

Draw what the system does at the level you chose, not which lines were edited: the path a request
takes, the states an object moves through, the order of calls, who owns the data, or what the user
sees on screen.

Choose the form by what the reader must compare:

- Behavior was replaced, rerouted, or removed → a `Before` drawing and an `After` drawing in one
  view. Use the same layout, positions, and labels in both, so that only the difference moves.
  Place them side by side on wide screens and `Before` above `After` on phones, or put them behind
  a two-option switch when each needs the full width. For a small change, two aligned lines
  labelled `Before` and `After` are enough.
- Behavior was added, and the earlier state is only its absence → the result alone.
- The exact text is the point, such as a signature, a config value, or a schema field → a focused
  `diff` block instead of a drawing.

Draw the unchanged parts in gray and the changed parts in `--chart-1`, so the eye lands on the
difference first. Write a consequence that matters, such as a latency, a count, or an
error, next to the part that causes it.

State the change in one sentence, then put the drawing directly after it. Follow the drawing with
only what it cannot show: the reason, the edge cases, and the risks. A change with nothing to draw,
such as a rename, a typo fix, or a new constant value, gets one sentence and no drawing.

For example, when a request handler no longer charges the card itself and a worker does, draw
`Handler → Stripe` as Before and `Handler → Worker → Stripe` as After, with the Worker and its
two edges in `--chart-1`, "request waits up to 30 s" under Before, and "request returns in 20 ms"
under After. When a job that stops sending heartbeats now gets one retry, draw only the result:
`queued → running → done`, plus a `stalled` state off `running` in `--chart-1` with its edge
labelled "no heartbeat for 60 s" and an edge back to `queued` labelled "one retry".

## In every view

Keep labels concrete. Place a visual next to the text it supports. Include only the calls, files,
props, states, and boundaries needed to answer the question.

Use one view or several, but rarely all of them. Each view must add information rather than repeat
the prose.

## Other useful views

Keep structural views narrow and concrete. A call tree should show runtime order and nesting, not
every function on the stack:

```text
submitForm
  createSession
    persistPrompt
    launchAgent
  navigateToSession
```

Use a component tree to show UI ownership. Add only the state, hooks, files, and package boundaries
that explain where behavior lives:

```tsx
<SessionPage> (apps/example/src/routes/session.tsx)
  useSessionEvents()
  <SessionToolbar>
    <RunSkillButton> (packages/ui)
```

Use a shallow file tree to show responsibility or the shape of a broad refactor:

```text
src/
├── commands/       # parses user actions
├── sessions/       # owns session state
└── transport/      # sends API requests
```

A `diff` block does not need to be a literal source diff. Match its shape to the view under
discussion so the reader can see the behavioral or structural change without translating edited
lines back into the system.

For a call tree or call stack change:

```diff
 submitForm
   createSession
     persistPrompt
+    expandSkillMention
     launchAgent
-  navigateToSession
+  navigateToSession
+    subscribeToEvents
```

For a component change:

```diff
 <SessionPage>
   useSessionEvents()
   <SessionToolbar>
+    <RunSkillButton />
   <SessionTimeline>
+    <SkillResultCard />
```

For a file layout change:

```diff
 src/
 ├── commands/
+│   └── show-me.ts       # expands the slash command
 ├── sessions/
-└── transport.ts
+└── transport/
+    ├── client.ts
+    └── stream.ts
```

For a state or control-flow change:

```diff
 on(save)
-  write content
+  if content is unchanged
+    return cached result
+  write new content
+  invalidate cache
```

Show the whole block instead when most of it is new, omitted context would hide ownership or order,
or the user needs a copyable target shape.
