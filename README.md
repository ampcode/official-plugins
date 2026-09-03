# Official Amp plugins

This public repository contains the agent modes that Amp serves to every user.

Each top-level directory is one plugin. `official-modes/` contains all official agent modes in one
plugin process, with one prompt and tool list file per model.

Changes land on GitHub `main`. The mirror workflow pushes them to Amp's internal Pierre repository,
which supplies global plugins and the Dial's Raw Models list.
