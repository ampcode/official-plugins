---
name: using-agent-browser
description: "Drives the preinstalled agent-browser Chromium in an orb for browser interaction, UI inspection, screenshots, recordings, and web E2E checks. Use before any agent-browser work: covers localhost dev servers, sessions that survive pause/resume, 2x screenshots, hover and touch emulation limits, and known command pitfalls."
metadata:
  sandbox-only: true
---

# Using agent-browser in an orb

agent-browser and Chrome for Testing (Chromium) are preinstalled in every orb. Run
`agent-browser skills get core --full` first; it is the version-matched reference for commands,
refs, sessions, restore, and recording. This skill adds only what the orb environment changes.

## Environment

- The browser runs inside the orb. It can open `http://localhost:<port>` dev servers directly. Only
  the user needs portal URLs, so share the portal URL with the user and never the localhost URL you
  browsed.
- If Chrome is missing, run `agent-browser install`.
- For a self-signed HTTPS dev server, pass `--ignore-https-errors` and
  `--args "--allow-running-insecure-content"` on the first `open`. Prefer an HTTP port when the
  server offers one.
- Launch flags such as `--args`, `--executable-path`, and `--ignore-https-errors` take effect when
  the session's browser starts. Pass them only on the first `open`, or identically on every
  command. Passing different flags, or passing `--args` again after commands without it, silently
  relaunches Chrome, which drops page state and the 2x viewport. To add a flag to a running
  session, `close` it and reopen with the flag.
- `--args` splits on every comma, so a comma-valued Chrome flag cannot go through it; use an
  `--executable-path` wrapper instead (see Hover-gated UI).
- Save every screenshot and recording the user should see under `.amp/in/artifacts/` by absolute
  path. The thread renders media only from the workspace, so files under `/tmp` show as broken
  placeholders. A path starting with `.` is read as a CSS selector.

## Sessions

- Reuse one named `--session` for a whole workflow. Keep at most three live sessions in one
  namespace; reuse or close one instead of opening a fourth. Keep session names to 20 characters or
  fewer so the Unix socket path stays under its 103-byte limit.
- Close sessions as soon as their part of the workflow ends, and before memory-heavy work such as
  test suites or builds.
- The browser daemon dies on orb pause and resume, on CLI restarts, and after an idle hour. Pass
  bare `--restore` on every command for a session that must keep login state. Restore keeps
  cookies and storage only: after a relaunch, `open <full URL>` (not bare `reload`) and reapply
  `set viewport`, `set device`, and `set media`.
- `[agent-browser] restore: missing; save: saved` is startup metadata, not a failure.
  `restore: load_failed; save: skipped_restore_failed` means the browser started without the saved
  login and will not save a new one; `session info --json` shows `restoreStatusDetail`. Close the
  session, run `state clear <key>`, reopen, and log in again.
- Tab IDs start at `t1`; run `tab list` for current IDs. `tab t0` and `tab 0` are rejected.
- Add `--auto-connect` only when the user asks to control an already-open browser.
- A shell helper that creates sessions installs an `EXIT` trap as soon as it knows the session
  names; a Node or TypeScript helper closes them in `finally`. Call cleanup explicitly on the
  success path too; a hard command timeout can skip the trap, so run cleanup in the next command
  after a timeout.

```bash
export AGENT_BROWSER_NAMESPACE=checkout-flow
SESSIONS=(buyer admin)
cleanup() {
	for session in "${SESSIONS[@]}"; do
		agent-browser --session "$session" --restore close >/dev/null 2>&1 || true
	done
}
trap cleanup EXIT

agent-browser --session buyer --restore open "$BUYER_URL"
agent-browser --session admin --restore open "$ADMIN_URL"
for session in "${SESSIONS[@]}"; do
	agent-browser --session "$session" --restore set viewport 1280 720 2
done

# workflow

cleanup
trap - EXIT
```

## Screenshots

- Screenshots must be 2x (`devicePixelRatio` 2); 1x looks blurry on retina displays. Run
  `set viewport <w> <h> 2` after the first `open` of a new or restarted session and after any
  `set viewport` that omits the scale, which resets that tab to 1x. Check with
  `eval devicePixelRatio` before capturing. Image pixel coordinates are then 2x the CSS values;
  selector clips are unaffected.
- Pass the output path as the last positional argument of `screenshot`; there is no `-s` or
  `--output` flag. Use unique filenames and confirm the fresh file exists with `test -f`. For the
  whole page, the flag is `--full`, not `--full-page`.
- Set screenshot scale with `set viewport`, not Chromium's `--force-device-scale-factor` launch
  flag. Combining the launch flag with viewport DPR produces incorrectly sized full-page captures.
- `set viewport`, `set device`, and init scripts apply to the current tab only. A popup opened by
  page code (`window.open`, `target=_blank`) gets neither; `tab new <url>` and
  `click <selector> --new-tab` replay init scripts but not the viewport. Open new pages with
  `tab new <url>` instead of triggering a popup, and after `tab <id>` onto any new tab check
  `eval devicePixelRatio` and rerun `set viewport <w> <h> 2` if it is not 2.
- Wait for the element, text, URL, or app-specific ready signal before every capture. After a
  viewport change, wait for two animation frames:
  `eval "new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))"`.
- Pass a selector or ref as the first `screenshot` argument only when the element sits inside the
  initial unscrolled viewport. Selector captures clip against the unscrolled surface, so below-the-
  fold or scrolled elements come out blank white and `scrollintoview` does not fix it. For those,
  scroll and capture the viewport without a selector, or capture `--full` and crop.
- Capture every representative affected state, not only the default one: open, selected, empty,
  loading, and error states when the change touches them.
- Inspect every capture with the media viewing tool before reporting it. It rejects files over
  1 MiB; compress with `magick in.png -resize 1280x900 -quality 85 out.jpg` and check
  `stat -c %s`. For exact colors or measurements, sample pixels with Python and Pillow instead of
  judging by eye.
- Use `set viewport <w> <h> 2` at several widths for breakpoint checks. A 390-pixel Chromium
  capture proves the narrow layout only; it is not a phone capture (see Touch and mobile).

## Hover-gated UI

Headless Chromium reports no input device: `(hover: none)` matches and `(pointer: fine)` does not.
Hover-gated UI such as tooltips never appears on `hover` or `mouse move`, and touch fallbacks render
in screenshots. To test hover, relaunch through a wrapper that adds the Blink settings:

```bash
cat > /tmp/chrome-desktop-pointer.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
chrome=$(ls -d "$HOME"/.agent-browser/browsers/chrome-*/chrome | sort -V | tail -n 1)
exec "$chrome" \
	'--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4' \
	"$@"
EOF
chmod +x /tmp/chrome-desktop-pointer.sh
agent-browser --session app close
agent-browser --session app --executable-path /tmp/chrome-desktop-pointer.sh open "<url>"
```

Verify `eval "matchMedia('(hover: hover)').matches"` is `true` before trusting hover results. A
relaunch without the wrapper reverts.

## Interaction recordings

Record a clip when a change affects how UI responds to the pointer or keyboard: hover states,
menus, popovers, inline forms, focus, or transitions. A clip shows what a person sees while moving
through the UI; screenshots of the end states do not.

Record with `scripts/action-video.mjs` in this skill's base directory. It needs only Node and
ffmpeg, and it uses a project's own `node_modules/.bin/agent-browser` when the working directory
has one. Launch the session through the hover wrapper above first; `start` refuses a session that
reports `(hover: none)`. Start from a settled state and route every browser command between
`start` and `stop` through the recorder:

```bash
REC="node <skill base directory>/scripts/action-video.mjs"
export ACTION_VIDEO_SESSION=app
$REC start "$PWD/.amp/in/flow-raw.mp4"
$REC mouse move 760 236
$REC mouse move 760 308
$REC click "[data-testid='add-comment']"
$REC wait "textarea"
$REC type "textarea" "Looks good."
$REC stop "$PWD/.amp/in/artifacts/flow.mp4"
```

- The recorder drives real input. `mouse move`, `hover`, `click`, `drag`, and the pointer part of
  `fill` and `type` travel along curved paths, so every element the pointer crosses gets real hover
  events. `fill` and `type` send real keystrokes, one character at a time. agent-browser's cursor overlay draws the pointer
  and click feedback; pass `start RAW --no-cursor` when the page draws its own pointer.
- Each `mouse move` and `hover` takes about 0.6 seconds and then holds for one second, so delayed
  hover effects such as tooltips appear. Do not add waits for pacing; wait only for required UI
  state.
- Tour the area the way a person would: pass over neighboring rows and similar controls before the
  target, click, wait for the result, then keep moving inside the new UI so its hover states show.
  Get coordinates from `get box <selector>`.
- Keep `AGENT_BROWSER_NAMESPACE` and `ACTION_VIDEO_SESSION` unchanged from `start` to `stop`.
- `stop` writes the MP4 at the tab's pixel ratio with idle stretches between commands removed, and
  for clips up to 30 seconds a looping animated WebP next to it (`.loop.webp`). The transcript plays
  a video once, so embed the WebP in image format and link the MP4. Keep the raw file unless the
  user asks for the uncut video. Never type secrets into a recording.
- Check the clip frame by frame before reporting. Video analysis samples about one frame per second
  and misses short hover states, so view a contact sheet:
  `ffmpeg -i flow.mp4 -vf fps=5,scale=640:-1 /tmp/f%03d.png` and
  `magick montage /tmp/f*.png -tile 4x -geometry +4+4 sheet.png`.

### Recording frame rate

Recordings default to 30 fps; pass `start RAW.mp4 --fps N` to choose 1–60. If recording fails with
"Recording encoder fell more than 500 ms behind capture" or "fell behind by more than 16 buffered
frames", retry with `--fps 15`. This usually happens on a busy machine or with a large viewport ×
device pixel ratio (DPR). The encoder takes the latest captured frame on each output tick, so
halving the output fps roughly halves encoding work. Dropping incoming screencast frames
(`everyNthFrame`) barely helps the encoder because it still encodes at the output rate. A smaller
viewport or DPR also reduces the work; lower fps keeps text readable but makes motion more stepped.

## Touch and mobile

agent-browser is Chromium-only and never emulates touch. `set viewport` and `set device` change
size, DPR, and user agent only, so `(pointer: coarse)` stays unmatched and `(hover: none)` matches.
Touch-only styles change sizes, spacing, and layout, so never present a `set device` screenshot as
what the UI looks like on a phone.

For mobile screenshots, touch verification, and Safari-only rendering bugs, use Playwright device
profiles from a scratch directory outside the workspace:

```bash
mkdir -p /tmp/wk && cd /tmp/wk && npm i playwright >/dev/null
npx playwright install webkit --with-deps      # iOS Safari approximation
```

```js
const { webkit, chromium, devices } = require('playwright')
const browser = await webkit.launch()
const context = await browser.newContext({ ...devices['iPhone 14'], ignoreHTTPSErrors: true })
const page = await context.newPage()
await page.goto(url)
if (!(await page.evaluate(() => matchMedia('(pointer: coarse)').matches))) throw new Error('no touch')
await page.screenshot({ path: '/absolute/workspace/.amp/in/artifacts/mobile.png' })
```

- The full device descriptor (`hasTouch`) is what makes `(pointer: coarse)` match; use `.tap()`.
- Android: `chromium.launch()` with a Pixel descriptor covers Android Chrome touch behavior. Orbs
  have no KVM, so an emulator is not an option; never present this as a real device test.
- Linux WebKit approximates macOS Safari; system colors and native selection painting differ.
  Confirm macOS-specific bugs on real Safari.
- Say which engine produced a mobile capture and that `(pointer: coarse)` was verified.
- For Playwright Chromium, pass `executablePath` from the agent-browser Chrome
  (`ls -1d "$HOME"/.agent-browser/browsers/chrome-*/chrome | tail -1`) instead of running
  `npx playwright install chromium`, which is a large download.

## Fake microphone

Chromium's fake media stack turns a WAV file into the microphone signal:

```bash
sudo apt-get install -y espeak-ng
espeak-ng -s 145 -v en-us -w /tmp/raw.wav "Your dictation text here."
ffmpeg -y -i /tmp/raw.wav -af "adelay=700:all=1,apad=pad_dur=1" -ar 48000 -ac 1 /tmp/speech.wav
agent-browser --session mic \
  --args "--use-fake-device-for-media-stream,--use-fake-ui-for-media-stream,--use-file-for-fake-audio-capture=/tmp/speech.wav,--autoplay-policy=no-user-gesture-required" \
  open "<url>"
```

The WAV must be mono 48 kHz `pcm_s16le`; it loops forever. Repeat the identical `--args` on every
command for that session. Verify with
`eval "navigator.mediaDevices.getUserMedia({audio:true}).then(s=>s.getTracks()[0].label)"`, which
returns `Fake Default Audio Input`.

## Troubleshooting

- There is no `mouse click` subcommand. Use `click <selector-or-ref>`; for coordinates, use
  `mouse move <x> <y>`, `mouse down left`, `mouse up left`. For a context menu, use
  `mouse down right` and `mouse up right`. `mouse move` takes integer coordinates.
- After `Unknown command` or `Missing arguments`, run `agent-browser --version` and
  `agent-browser <subcommand> --help` before changing flags.
- If `open` fails with `Could not configure browser: Failed to connect: No such file or directory`,
  retry the same `open` once, then check `get url`.
- Do not retry a hanging command in a loop. Run `agent-browser doctor --offline --quick`, inspect
  the session, then close and reopen it.
- If `open` reports `CDP command timed out: Page.navigate`, run `get url` once. If it shows the
  expected destination, continue. After a `Runtime.evaluate` timeout, retry only a read-only or
  safely repeatable command; the evaluation may have run.
- An unmet `wait --text` or `wait --url` reports `Wait timed out`; that is not a browser failure.
  Check `get url` and a `snapshot` before restarting anything. Transport failures say so
  explicitly, for example `CDP WebSocket connect failed`.
- If a click is rejected because another element covers the target, take a fresh snapshot, dismiss
  or scroll past the obstruction, and target the visible control with `find label "X" click` or
  `find role button click --name "X"`. Use a DOM `.click()` in `eval` only as a last resort; it can
  hide a real overlay bug.
- Playwright pseudo-selectors such as `:has-text()` do not work. Use `find text "…"`,
  `find role <role> click --name "…"`, or `eval` with `querySelectorAll`.
- `:hover` follows only trusted input from `mouse move`; events dispatched in `eval` do not trigger
  it. For hover performance work, send the moves in one `batch` so per-command latency does not
  hide the problem.
- If `type` shows nothing in a canvas-rendered terminal such as xterm.js, click it to focus and send
  batched `press` calls per key, then `Enter`.
- `batch` step strings strip quotes. For quoted JavaScript or selectors, pass a JSON array of
  argument arrays on stdin:
  `agent-browser batch <<'JSON'` … `[["open","https://example.com"],["eval","document.title"]]`.
- Wrap multi-statement `eval` in an IIFE or block. Top-level `const` and `let` persist across
  calls in a session and cause `Identifier has already been declared`.
- The orb's agent-browser build has no runtime `addinitscript` command. Pass `--init-script <path>`
  when launching the browser instead.
- If `open` lands on `about:blank` or `snapshot` shows `(no interactive elements)` for a local
  HTTPS server, relaunch with the HTTPS flags from Environment on the first `open`.
