---
name: explaining-code
description: "Explains code, system behavior, and code changes with plain technical prose, before and after diagrams, pseudocode, call trees, and diffs. Use for architecture walkthroughs, when asked how something works, or when explaining what a change does: a diff, a commit, a pull request, or the work just done in this thread."
---

# Explaining code

Help the user understand how code or a system works, or what a change does. Lead with the behavior
in plain technical prose. Name the functions, components, data, APIs, and ownership boundaries that
matter. Define a technical term when the user may not know it. Keep necessary detail, but cut
preamble and filler.

## Explaining how something works

Use the smallest view that makes the explanation easier to follow, or prose alone when prose is
clearer:

- Logic or an algorithm → pseudocode
- Runtime order → call tree
- UI ownership → component tree with relevant state and module boundaries
- File ownership → shallow file tree
- Interaction, data flow, states, or architecture → a fenced `diagram` block

## Diagram blocks

For `diagram` blocks, use portable Unicode line art. Amp renders light connectors as muted
structure and these glyphs with one vibrant accent: `━┃┏┓┗┛┣┫┳┻╋▶◀▲▼●◆■!?`. Use the accent
only for the decisive path, state, or transition.

```diagram
┌──────────┐     ┌──────────┐
│ Request  │────→│ Validate │
└──────────┘     └────┳─────┘
                      ┃
                      ▼
                 ┌─────────┐
                 │ Persist │
                 └─────────┘
```

## Explaining a change

A change is anything that makes the code behave differently than it did: a diff, a commit, a pull
request, a fix, a proposal, or the work just done in this thread. Show a change in a `diagram`
block by default. The reader then sees what is different at a glance; prose alone makes them
rebuild both versions in their head.

Draw what the system does, not which lines were edited: the path a request takes, the states an
object moves through, the order of calls, who owns the data, or what the user sees on screen.

Choose the form by what the reader must compare:

- Behavior was replaced, rerouted, or removed → a `Before` drawing and an `After` drawing in one
  block. Use the same view, layout, and labels in both, so that only the difference moves. Place
  them side by side when the block stays under about 70 columns; otherwise put `Before` above
  `After`. For a small change, two aligned lines labelled `Before` and `After` are enough.
- Behavior was added, and the earlier state is only its absence → the result alone.
- The exact text is the point, such as a signature, a config value, or a schema field → a focused
  `diff` block instead of a drawing.

Draw the unchanged parts with light lines and the changed parts with the accent glyphs, so the eye
lands on the difference first. Write a consequence that matters, such as a latency, a count, or an
error, next to the part that causes it.

State the change in one sentence, then put the drawing directly after it. Follow the drawing with
only what it cannot show: the reason, the edge cases, and the risks. A change with nothing to draw,
such as a rename, a typo fix, or a new constant value, gets one sentence and no drawing.

Example of a rerouted flow. The request handler no longer charges the card itself; a worker does:

```diagram
Before                          After

┌─────────┐                     ┌─────────┐
│ Handler │                     │ Handler │
└────┬────┘                     └────┳────┘
     │ charge()                      ┃ enqueue()
     ↓                               ▼
┌─────────┐                     ┏━━━━━━━━━┓
│ Stripe  │                     ┃ Worker  ┃
└─────────┘                     ┗━━━━┳━━━━┛
                                     ┃ charge(), 3 retries
request waits up to 30 s             ▼
                                ┌─────────┐
                                │ Stripe  │
                                └─────────┘

                                request returns in 20 ms
```

Example of added behavior, result only. A job that stops sending heartbeats now gets one retry:

```diagram
queued ──→ running ──→ done
              ┃
              ┃ no heartbeat for 60 s
              ▼
          ● stalled ━━▶ queued (one retry)
```

## In every view

Keep labels concrete. Place a visual next to the text it supports. Include only the calls, files,
props, states, and boundaries needed to answer the question.
