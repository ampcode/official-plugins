---
name: explaining-code
description: "Explains code and system behavior with plain technical prose, focused diagrams, pseudocode, call trees, and diffs. Use for architecture walkthroughs or when asked how something works."
---

# Explaining code

Help the user understand how code or a system works. Lead with the behavior in plain technical
prose. Name the functions, components, data, APIs, and ownership boundaries that matter. Define a
technical term when the user may not know it. Keep necessary detail, but cut preamble and filler.

Use the smallest view that makes the explanation easier to follow:

- Logic or an algorithm → pseudocode
- Runtime order → call tree
- UI ownership → component tree with relevant state and module boundaries
- File ownership → shallow file tree
- Interaction, data flow, states, or architecture → a fenced `diagram` block
- An existing shape changing → a focused `diff` block

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

Keep labels concrete. Place a visual next to the text it supports. Include only the calls, files,
props, states, and boundaries needed to answer the question. Use prose when prose is clearer.
