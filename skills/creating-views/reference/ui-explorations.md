# UI explorations, prototypes, and experiments

A UI exploration exists to settle one design decision. It succeeds when the reader can pick a direction after trying it, not when it looks finished. `examples/design-options.html` is the pattern.

## Frame the decision

- The title asks the question the exploration settles: "Where should a failed attachment upload show?" The subtitle names the directions and tells the reader what to try.
- Show today's shipped behavior first, labeled "Today", so every direction is judged against what exists. Skip it only for a surface that does not exist yet.
- Offer at most three directions, each different on one named axis (placement, density, interaction model, how much it interrupts). If two directions differ only in color or copy, they are one direction. Name each by what it does ("On chip", "Block send"), not "Option A".
- Put one muted trade-off line under the switcher that changes with the selection: what this direction costs, not only what it gains.
- When you rejected a direction while designing, say so in one "Also considered" line with the reason, instead of building it.
- When the user asks for many options, group them by axis with one verdict per group, show them as a list beside one stage that renders the selected option, and narrow to two or three in the next round.

## Show the deciding state

- Open on the state that decides the design, not the empty or happy state: the error, the long title, the open menu, the narrow width.
- Add a second control, outside the mock, for the condition that stresses each direction ("1 file failed", "1 of 3 failed", "Offline"). Every direction must handle every condition.
- Pin hover-only UI (a tooltip, a menu, a row's actions) open in the default state, because screenshots and phones never hover.
- Crop to the region that matters inside one surface for the window. A composer change needs the composer and the last message, not the whole app. Crop a phone frame to its content instead of drawing the full device.
- Stack full-width directions vertically or behind a switcher; place small components side by side at the same scale.

## Make the actions work

- Keep all state in one object, render the whole mock from it, and re-render on every change. Never patch the DOM piecemeal.
- Make the actions that decide the design real buttons that change the state: Retry, Remove, Send, Undo. A mock where the deciding action does nothing cannot settle the question.
- After a re-render, move focus back to the control the reader used.
- Give targets at least 24px, and 44px when the mock is of a touch surface.
- Offer Reset, and replay or slow motion when timing is the question (a toast's duration, a transition). Do not loop an animation unless the shipped animation loops.
- Use the kit's controls for the exploration's own switcher and conditions, and keep them visually separate from the mock so the reader never confuses the two.

## Mocking Amp

- Read the surface's DESIGN.md and the real component source before drawing. When the source and this skill's type rules differ, the source wins inside the mock.
- Reuse Amp's anatomy from the kit: `.ui-user-msg`, `.ui-tool-row`, `.ui-composer`, `.ui-chip`, `.ui-btn`. Tool and event rows are plain muted text with no icons. While the agent is running, the composer's send button shows Stop.
- Use Title Case for titles and buttons inside the mock when Amp does; the exploration's own labels stay in sentence case.
- Use real copy and realistic data: real file names, real error messages, plausible lengths. Placeholder text hides the problems the exploration is for, such as wrapping and truncation.
- When mocking another product, use its real colors and type from its code.
- For a status or notification card (an approval request, a finished run, an error), mock the surface it appears on, show the states it moves through (pending, done, failed) behind a switch, and use the real copy for each.

## Experiments and calculators

An experiment lets the reader change an input and see a consequence: a pricing calculator, a timeout tuner, a layout density slider.

- Open on the observed or agreed values, not round placeholders.
- Compute the title from the current state, so it always states the current answer ("At 40 requests per second, p95 stays under 200 ms").
- Show the output the reader cares about large enough to follow, and animate numbers with `ui.tween` so changes are visible.
- Mark the inputs that are assumptions, and the range over which the model holds.
- When there is a threshold, say where it is: "Above 64 the queue never drains."

## Sketches and wireframes

When the question is layout or flow rather than visual detail, draw a wireframe instead of a polished mockup:

- Content is gray bars (`.ui-wire`); containers are hairline rings (`.ui-wire-box`). Write real text only where it matters (button names, file names, the label that is in question).
- Color only what carries meaning in the sketch, such as diff green and red or the primary button.
- Number the decisions with `.ui-note` markers, list the notes beside or below the sketches, and highlight a note's region in every variant on hover.
- Show two or three variants side by side at the same scale, each with a short name.
- Keep the geometry crisp. No hand-drawn wobble, handwriting fonts, or fake paper textures.
