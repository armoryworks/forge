# Release notes

This folder holds the detailed, week by week notes for the whole Forge platform:
the API, the web app, and the database. The short summary is in RELEASES.md at
the top of the repo, and that is the main file to read.

## Files

- ../RELEASES.md is the primary file. A short, plain summary of each release,
  newest first, with less detail. Read this one first.
- releases/YYYY-MM-DD.md is one file per week, named for the Monday of that week.
  Full detail, grouped by app, with the reason for each change.

## When a new entry is written

A new entry is written on the first release after a week has passed since the
last entry, or as soon as any app's minor version goes up (for example 0.1 to
0.2). Not every build gets its own entry. Routine builds in the same week are
added to that week's file.

## How entries are written

Entries are built from the commit messages in the app repos, so they stay in the
words the developers wrote instead of being rephrased. Keep commit messages clear
about what changed and why, and the notes mostly write themselves. A person does
a short pass for readability before the entry lands.

## Folding old entries

The primary file is kept short. Once an entry is no longer recent it gets folded
into a single line covering a range, for example "Between API 0.1.0 and 0.5.0".
The detailed weekly files are never folded; they stay as written.

## Pinned changes

A change can be marked pinned. A pinned change is never folded or rephrased. It
stays word for word in RELEASES.md for as long as it is relevant. Pin a change
when its exact wording should always be easy to find. Mark it with an HTML
comment around the block:

    <!-- pinned -->
    ... the change text ...
    <!-- /pinned -->

## Style

Keep these plain and readable. Short sentences. No icons or emoji. Avoid jargon
and marketing words. Do not use em dashes. Write the way you would explain the
change to a coworker.
