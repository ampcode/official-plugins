# Official Amp plugins

This public repository contains the agent modes and the official skills that Amp serves to every
user.

Each top-level directory except `skills/` is one plugin. `official-modes/` contains all official
agent modes in one plugin process, with one prompt and tool list file per model.

`skills/<name>/` holds one official skill each: a `SKILL.md` with `name` and `description`
frontmatter plus any reference files it needs. Amp serves every skill in this directory to every
signed-in user as an official skill (scope `official`); a user or workspace skill with the same name
takes precedence on that user's machine. Each skill is versioned by the last commit that touched its
own files, so editing one skill does not re-download the others.

Changes land on GitHub `main`. The mirror workflow pushes them to Amp's internal Pierre repository,
which supplies global plugins and the Dial's Raw Models list.
