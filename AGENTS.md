# Project Architecture

- Store external and uploaded video locations in the existing `videos.youtube_url` field; the field is a legacy name but supports any HTTP(S) video URL to avoid a breaking data migration.