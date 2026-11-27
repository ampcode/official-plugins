---
name: sharepoint
description: "Searches, browses, downloads, and uploads SharePoint and OneDrive for work or school files, and creates folders. Use when working with SharePoint sites, document libraries, OneDrive files, or SharePoint links."
builtin-tools:
  - sharepoint
metadata:
  feature: sharepoint-tools
---

# SharePoint

Use the connected Microsoft 365 work or school account to find, read, and upload SharePoint and OneDrive files.

## Access

- sharepoint is a built-in tool. Use the tool schema returned with this skill: call it directly or from code_exec. If it is not described, give the access instructions below. reload_mcp does not manage it.
- It reads with Read access, and with Read and Write access also uploads files and creates folders. It cannot move, rename, delete, or share files; say so instead of trying another way.
- It sees only what the connected account can open in SharePoint. When a file the user names is not found, it may be outside their access; say that rather than claiming it does not exist.
- The user turns it on under Settings → Integrations & MCP → Microsoft 365 by setting SharePoint and OneDrive to Read, or to Read and Write to upload. Give the complete steps, for example: "I can't read SharePoint with the current access. Open Settings → Integrations & MCP → Microsoft 365, set SharePoint and OneDrive to Read, click Connect Microsoft (or Change Access), and approve Microsoft's consent screen. Then ask me to try again."
- Some organizations let only an admin approve apps that read files. The settings card then shows Admin Approval Needed with a link to send to a Microsoft 365 admin. Point the user there; you cannot approve it.
- The tool is never available in multiplayer threads, and a missing tool does not tell you whether the account is disconnected or lacks permission.

## Finding files

- When the user pastes a SharePoint or OneDrive link, pass it as url to get_item, list_children, or download. Sharing links work too.
- Otherwise search first. search matches names and contents across every site; narrow with KQL such as `filetype:pptx`, `author:"Alice Example"`, `path:"https://contoso.sharepoint.com/sites/marketing"`, or `LastModifiedTime>=2026-10-01`. Follow nextPageToken before concluding that a file is not there.
- To browse instead, list_sites, then list_drives with the siteID, then list_children with the driveID and a folder's itemID.

## Reading files

- download returns an authenticated URL valid until the thread is archived. Fetch it with amp files get <url> -o .amp/in/<name> and read the local file; do not commit it.
- Read PDFs and images with view_media. For Word, Excel, and PowerPoint files, extract text with python-docx, openpyxl, or python-pptx in a python3 -m venv.
- Files over 20 MiB cannot be downloaded; give the user the item's webURL instead.

## Writing files

- When the user wants to upload and the tool reports insufficient scope, give the access steps above with Read and Write instead of Read.
- upload and create_folder go into the folder named by url or by driveID and itemID, a drive's root with driveID alone, or the root of the user's own OneDrive with neither. Find a folder the user names with search or list_children first.
- Pass text files as content. For a binary file, such as a .docx or .xlsx you generated, call thread_file_url on the local file and pass the url it returns as fileURL; a file the user attached works too. fileURL accepts images, PDFs, audio, video, and office documents up to 20 MiB.
- Both fail when the name already exists. Set replace on upload only when the user asked to overwrite that file; otherwise pick another name or ask.
- Give the user the returned item's webURL.
