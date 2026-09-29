---
name: google-workspace
description: "Finds files in Google Drive and reads or edits Google Docs and Sheets. Use for Google Workspace files."
builtin-tools:
  - google_drive_search
  - google_drive_download
  - google_docs_read
  - google_docs_write
  - google_sheets_read
  - google_sheets_write
metadata:
  feature: gmail-skill
---

# Google Workspace

## Access

- These are built-in tools. Use the tool schemas returned with this skill: call them directly or use the supplied code_exec imports. If the needed tool is not described, give the access instructions below. reload_mcp does not manage these tools.
- Ask for Docs or Sheets Read to read, or Read and Write to create or edit. Give the complete steps, including Request Access and Google consent, rather than just saying "enable Docs". For example, when reading a document is blocked: "I can't read this Google Doc with the current access. Open Settings → Integrations → Google, set Docs to Read, click Request Access, and approve Google's consent screen. Then ask me to try again."
- Missing tools do not distinguish a disconnected account from insufficient permission. Do not claim to know which it is or claim to grant access yourself.
- A pasted Docs or Sheets link does not establish public access. Use the connected service; if its tool is missing, give the access instructions instead of trying unauthenticated web requests. For a file the user explicitly says is public or published to the web, a web read is appropriate.
- Drive Read is needed to find files by name, search their contents, and read documents as text. A Docs or Sheets link needs only that service's access, not Drive access.

## Workflow

- Use the file ID from a Google URL's /d/<ID>/ segment, or the folder ID from a /folders/<ID> segment. When given a name instead, search Drive if available, for example: trashed = false and name contains 'Budget'. Drive search returns metadata, not file contents; use fullText contains in the query to match document body text server-side.
- List a folder with '<folderID>' in parents; subfolders need their own query. If the result's notice says the folder could not be read, ask the user to share it with the connected account.
- Read Docs and Sheets with their own tools first: they return structure the write tools need. When a document read fails with a size-limit error, pass the same file ID to google_drive_download, which exports it as Markdown and returns a temporary authenticated download URL valid for 24 hours. Download it with amp files get <url> -o .amp/in/<name> and read the local file; do not commit it.
- Use google_drive_download for files the Docs and Sheets tools cannot read: uploaded PDFs, images, and Office documents are downloaded as stored, and Slides and Drawings are exported as text and PNG. Pass exportMimeType to export a Google-native file in a different format Google supports.
- Read PDFs and images with view_media. For many PDFs or DOCX files, extract text with pymupdf or python-docx in a python3 -m venv; check scans and multi-column pages against the rendered page, since extraction misses images and interleaves columns.
- Read a Doc or Sheet before updating it. Docs reads include tabs; target the intended tab in batchUpdate requests and pass the revision ID from that read. If the revision is stale, read again before editing.
- Read Sheets metadata to find tab names, then read a bounded A1 range such as 'Budget 2026'!B3:D20.
- Sheet values default to RAW. Use USER_ENTERED only when formulas or locale parsing are intended.
- Use write tools only when the user asks to create or change a file. If a write fails without a clear outcome, read the file before retrying so changes are not duplicated.
