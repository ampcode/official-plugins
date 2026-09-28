---
name: gmail
description: "Reads, searches, sends, archives, and labels Gmail messages. Use when working with Gmail or email."
builtin-tools:
  - gmail
---

# Gmail

Use the connected Gmail account to search, read, send, archive, and label email.

## Access

- gmail is a built-in tool. Use the tool schema returned with this skill. Call it directly as a
  tool; send_message may wait on the user, so gmail cannot run inside code_exec. If the tool is not
  described, give the access instructions below. reload_mcp does not manage this tool.
- The user picks a Gmail access level under Settings → Integrations → Google: Read (search and
  read), Read and Organize (also archive and label), Read, Organize, and Draft (also compose;
  every send goes through a confirmation dialog), or Read, Organize, and Send (may send without
  the dialog). Ask for the lowest level the task needs. Give the complete steps, including
  Request Access and Google consent, rather than just saying "enable Gmail". For example, when
  reading is blocked:
  "I can't read your Gmail with the current access. Open Settings → Integrations → Google,
  set Gmail to Read, click Request Access, and approve Google's consent screen.
  Then ask me to try again."
- Missing tools do not distinguish a disconnected account from insufficient permission. Do not
  claim to know which it is or claim to grant access yourself. If send_message reports that the
  user has not allowed sending, ask them to raise the level to Draft or Send.

## Workflow

- Use gmail with operation "search_messages" to find messages. Gmail query syntax works:
  from:, to:, subject:, newer_than:, older_than:, has:attachment, label:, and quoted terms.
- Use gmail with operation "read_message" and a messageID to read full message content.
  Search results return at most 20 messages per call, newest first; follow nextPageToken with
  pageToken before concluding that a message is not there.
- A mail.google.com URL does not identify a message for you. Its last path segment (for example
  FMfcgzQhWTsNtnWMrzmzcwwPVbFBcLbd) is an opaque web ID with no conversion to an API message ID,
  and any "#search/<query>/" or "#label/<name>/" prefix is only the folder view the user had
  open. When the user gives such a URL without describing the message, ask for its subject
  and/or sender before reading anything; do not guess from a search. Then search with those
  details, read the result only when exactly one matches, and tell the user which message you
  read; if several match, list them (sender, subject, date) and ask which one they meant.
- Use gmail with operation "list_labels" to list the available Gmail labels.
- Use gmail with operation "send_message" to send email when the user asks for it. At the
  Draft level, and at the Send level when you set requireConfirmation: true, the user sees a
  confirmation dialog with the exact email (sender, recipients, subject, and body), can edit the
  recipients, subject, and body, and the email goes out only if they approve. The thread waits
  until they answer. If they decline, do not retry or work around it; offer to change the email.
  When they edited the email, the result includes userEdited: true and the sentEmail that went
  out; describe what was actually sent.
- Set requireConfirmation: true whenever the user asked to review, approve, or see the email
  first, or when the email is sensitive, so the dialog appears even at the Send level.
- To send a reply on an existing conversation, first use read_message on the original message,
  then pass its threadID, a subject matching the original (with a "Re:" prefix), inReplyTo set to
  the original's messageIDHeader, and references set to the original's references followed by its
  messageIDHeader. Without threadID the reply lands in a new conversation.
- Use gmail with operation "archive" with a threadID to remove a whole conversation from
  the inbox.
- Use gmail with operation "modify_labels" with a messageID and addLabels/removeLabels to
  change a message's labels. Labels must already exist; if one is missing, ask the user to create
  it in Gmail. System labels work too: removing UNREAD marks as read, adding STARRED stars a
  message, and removing INBOX archives that one message.

## Safety

- Below the Send level every send is confirmed by the user in a dialog, so you do not need to ask
  for permission in chat before calling send_message. At the Send level the email goes out
  immediately unless you set requireConfirmation: true, so be sure the user actually asked you to
  send it. In every case make sure recipients, subject, and body are what the user asked for; the
  dialog is a final check, not a place to discover mistakes.
- Do not send sensitive information unless the user explicitly requested it.
