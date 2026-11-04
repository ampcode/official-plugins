---
name: outlook
description: "Reads, searches, sends, and organizes Outlook (Microsoft 365) email, and reads or changes Outlook calendar events. Use when working with Outlook, Office 365, or Microsoft 365 mail or calendars."
builtin-tools:
  - outlook_mail
  - outlook_calendar
metadata:
  feature: microsoft-365-tools
---

# Outlook

Use the connected Microsoft 365 work or school account to work with Outlook mail and calendar.

## Access

- outlook_mail and outlook_calendar are built-in tools. Use the tool schemas returned with this skill: call them directly or from code_exec. If the needed tool is not described, give the access instructions below. reload_mcp does not manage these tools.
- The user picks access levels under Settings → Integrations & MCP → Microsoft 365. Outlook Mail: Read, Read and Organize (also move and mark read), Read, Organize, and Draft (also write email; every send goes through an approval dialog), or Read, Organize, and Send (may send without the dialog). Outlook Calendar: Read, Read and Write with Approval, or Read and Write. Ask for the lowest level the task needs.
- Give the complete steps rather than just saying "connect Outlook". For example, when reading mail is blocked: "I can't read your Outlook mail with the current access. Open Settings → Integrations & MCP → Microsoft 365, set Outlook Mail to Read, click Connect Microsoft (or Change Access), and approve Microsoft's consent screen. Then ask me to try again."
- Some organizations let only an admin approve apps that read mail. When that happens, the settings card shows Admin Approval Needed with a link to send to a Microsoft 365 admin. Point the user there; you cannot approve it.
- Only work and school accounts are supported. Personal Outlook.com, Hotmail, and Live accounts cannot connect.
- Missing tools do not distinguish a disconnected account from insufficient permission, and the tools are never available in multiplayer threads. Do not claim to know which case it is or claim to grant access yourself.

## Mail

- To find a message, search with KQL, for example `from:alice subject:budget received>=2026-10-01` or `hasAttachments:true invoice`. Follow nextPageToken with pageToken before concluding that a message is not there.
- An outlook.office.com or outlook.live.com URL does not give you a message ID you can use. When the user gives such a URL without describing the message, ask for its subject or sender, search, and read the result only when exactly one matches.
- Attachments are listed by name, type, and size but cannot be downloaded.
- move_message returns a new messageID; use it for later calls on that message.
- Below the Send level every send is approved by the user in a dialog, so you do not need to ask in chat first. At the Send level the email goes out immediately unless you set requireConfirmation: true, so be sure the user asked you to send it. In every case check that recipients, subject, and body are what the user asked for. Do not send sensitive information unless the user explicitly asked.
- To send several separate emails, start all the send_message calls at once, as parallel tool calls or with Promise.all in one code_exec; each email gets its own dialog.

## Calendar

- Pass the user's IANA time zone on every call. If you do not know it, ask, or use the time zone the user's messages imply.
- For a meeting time the user names, list that day's events first to check for conflicts when it matters.
- Creating or updating an event with attendees sends them invitations from the user's account. Make sure the attendee list is what the user asked for.
