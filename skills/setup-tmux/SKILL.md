---
name: setup-tmux
description: "Configure tmux for optimal Amp CLI compatibility. Use when setting up tmux, troubleshooting tmux issues (images, clipboard, Shift+Enter), or asked to check/fix tmux configuration."
---

# Setup tmux for Amp

Analyzes and configures tmux to work optimally with Amp CLI.

## Required tmux Options for Amp

| Option | Purpose | Required For |
|--------|---------|--------------|
| `set -g allow-passthrough all` | Allows escape sequences to pass through to outer terminal | Kitty graphics (images), notifications |
| `set -g focus-events on` | Enables focus reporting for the Amp TUI | Attention and notification features |
| `set -ga terminal-features ",*:hyperlinks"` | Enables OSC 8 hyperlink support | Clickable links in markdown, file references |
| `set -s set-clipboard on` | Enables OSC 52 clipboard | Copy/paste via terminal escape sequences |
| `set -s extended-keys on` | Enables extended key sequences | Shift+Enter detection |

## Required Shift+Enter Mapping

Amp expects Shift+Enter as CSI-u: `ESC [ 13 ; 2 u`.

Add this tmux binding so Shift+Enter sends the exact sequence Amp expects:

```tmux
bind -n S-Enter send-keys -l "\x1b[13;2u"
```

Without this binding, many tmux + terminal combinations collapse Shift+Enter into plain Enter.

## iTerm2 Compatibility

iTerm2 may need a profile-level key mapping so tmux receives the CSI-u sequence.

In **iTerm2 > Settings > Profiles > Keys > Key Mappings**:
1. Add mapping for **Shift+Enter**
2. Action: **Send Escape Sequence**
3. Value: `[13;2u`

tmux still needs `set -s extended-keys on` and the `bind -n S-Enter` mapping above.

## Workflow

### Step 1: Find the tmux Configuration File

Check these locations in order:
1. `$XDG_CONFIG_HOME/tmux/tmux.conf` (if XDG_CONFIG_HOME is set)
2. `~/.config/tmux/tmux.conf`
3. `~/.tmux.conf`

Run `tmux display -p '#{config_files}'` to see which config file tmux is actually using.

### Step 2: Analyze Current Configuration

Read the config file and check for:
- `allow-passthrough` - should be `all` or `on`
- `focus-events` - should be `on`
- `terminal-features` with `hyperlinks`
- `set-clipboard` - should be `on`
- `extended-keys` - should be `on`
- `bind -n S-Enter send-keys -l "\033[13;2u"`

Also check runtime settings:
```bash
tmux show-options -g allow-passthrough
tmux show-options -g focus-events
tmux show-options -g terminal-features
tmux show-options -s set-clipboard
tmux show-options -s extended-keys
tmux list-keys | grep 'S-Enter'
```

If user is in iTerm2, ask them to verify Shift+Enter key mapping exists in the active profile.

### Step 3: Report Findings

Present the user with:
1. Current configuration status for each option
2. Which Amp features are affected by missing options
3. Whether Shift+Enter path is fully configured (terminal mapping + tmux mapping)
4. Recommended changes

### Step 4: Ask User for Action

Offer two choices:
1. **Update config file** - Persist changes permanently
2. **Apply at runtime only** - Temporary until tmux server restarts

### Step 5: Apply Changes

**For config file updates:**
Add missing options to the config file. Append to the end with a comment:

```tmux
# Amp CLI compatibility settings
set -g allow-passthrough all
set -g focus-events on
set -ga terminal-features ",*:hyperlinks"
set -s set-clipboard on
set -s extended-keys on
bind -n S-Enter send-keys -l "\x1b[13;2u"
```

**For runtime-only changes:**
```bash
tmux set -g allow-passthrough all
tmux set -g focus-events on
tmux set -ga terminal-features ",*:hyperlinks"
tmux set -s set-clipboard on
tmux set -s extended-keys on
tmux bind -n S-Enter send-keys -l "\x1b[13;2u"
```

After runtime changes, tell the user to reload their config or restart tmux to persist.

### Step 6: Verify End-to-End

1. Confirm binding is active: `tmux list-keys | grep 'S-Enter'`
2. In Amp prompt editor, type text and press Shift+Enter
3. Success: new line inserted without submitting
4. If still failing in iTerm2, configure Shift+Enter key mapping to `[13;2u` in active profile

## Feature Impact Reference

| Missing Option | Impact |
|----------------|--------|
| `allow-passthrough` | Images won't display, notifications won't work |
| `focus-events on` | Amp cannot track terminal focus for attention and notification features |
| `terminal-features` with hyperlinks | Links in markdown won't be clickable |
| `set-clipboard on` | Clipboard uses fallback (pbcopy/xclip) instead of OSC 52 |
| `extended-keys on` | tmux cannot parse extended key sequences |
| `bind -n S-Enter send-keys -l "\033[13;2u"` | Shift+Enter may submit instead of inserting newline |
| iTerm2 Shift+Enter mapping | tmux may never receive CSI-u sequence from terminal |

## Examples

- "Set up tmux for Amp"
- "Check my tmux configuration"
- "Why don't images work in tmux?"
- "Enable Shift+Enter in tmux"
