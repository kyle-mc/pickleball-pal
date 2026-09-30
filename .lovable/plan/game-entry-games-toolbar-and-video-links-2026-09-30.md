# Game Entry, Games Toolbar, and Video Links

## Goal
Make repeated game entry faster, simplify the Games page controls, and accept video links from services beyond YouTube.

## Changes

### Record New Game
- Add compact minus and plus icon buttons beside each team score while retaining the existing number field and slider.
- Keep score changes within valid bounds and preserve the existing win-by-two validation and automatic score behavior.
- Add a **Shuffle Players** control beside **Swap Teams** for doubles games.
- Shuffle all four selected players into a genuinely different 2-v-2 arrangement when possible; if fewer than four players are selected, keep empty slots while shuffling selected players.
- Stop filtering already-selected names out of the four player menus, so temporary duplicate selections are possible while rearranging teams.
- Show an inline duplicate-player warning and disable **Record Game** until every required player is unique. Keep a final validation guard when saving.

### Games Page Controls
- Keep **Voice**, **Bulk Add**, and **Add** together at the upper right on wider screens.
- On phones, order those actions as **Add**, **Voice**, then **Bulk Add**.
- Move **Compact / Expanded** into the filter row directly beside the **Newest / Oldest** sort control.
- Remove the date/calendar filter control entirely.
- Reduce the season selector to fit its label and current badge instead of using a wide fixed width.

### Videos
- Rename the link option and field from YouTube-specific wording to general **Video Link** wording.
- Accept any valid `http` or `https` URL and continue duplicate detection using the normalized full link.
- Preserve rich playback for YouTube and direct video-file URLs.
- For other providers, show a neutral video preview and open the original link safely in a new tab from the video viewer.
- Update bulk-import and tour wording that currently claims links must be YouTube links.

## Validation
- Verify score steppers, shuffle behavior, duplicate warning, and save blocking in both singles and doubles.
- Check Games controls at phone and desktop widths, including action order and compact season sizing.
- Add/test YouTube, direct-file, and non-YouTube links and confirm each has a usable playback/open flow.
- Confirm the preview builds without errors and check the updated screens in the browser.

## Technical Notes
- No database change is needed; the existing video URL field can store general links.
- Existing game score and MMR submission rules remain unchanged.
