import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { building } from '$app/environment';
import { env } from '$env/dynamic/private';

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

CREATE TABLE IF NOT EXISTS entries (
	id         INTEGER PRIMARY KEY,
	user_id    TEXT NOT NULL,
	user_name  TEXT NOT NULL,
	body       TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS entries_created ON entries (created_at);
`;

export interface Entry {
	id: number;
	userID: string;
	userName: string;
	body: string;
	createdAt: string;
}

export const MAX_ENTRY_LENGTH = 500;

function open(): DatabaseSync {
	// During `vite build` SvelteKit imports server modules to analyze them; don't touch disk then.
	// On a Box, AMP_DEPLOYMENT_DATA_DIRECTORY is outside the checkout and survives deploys.
	const dataDirectory = env.AMP_DEPLOYMENT_DATA_DIRECTORY?.trim() || 'data';
	const path = building ? ':memory:' : env.DATABASE_PATH || join(dataDirectory, 'app.sqlite');
	if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
	const db = new DatabaseSync(path);
	db.exec(SCHEMA);
	return db;
}

const db = open();

interface EntryRow {
	id: number;
	user_id: string;
	user_name: string;
	body: string;
	created_at: string;
}

function toEntry(row: EntryRow): Entry {
	return {
		id: row.id,
		userID: row.user_id,
		userName: row.user_name,
		body: row.body,
		createdAt: row.created_at
	};
}

export function listEntries(limit = 100): Entry[] {
	const rows = db
		.prepare('SELECT * FROM entries ORDER BY created_at DESC, id DESC LIMIT ?')
		.all(limit) as unknown as EntryRow[];
	return rows.map(toEntry);
}

export function addEntry(user: { id: string; displayName: string }, body: string): Entry {
	const trimmed = body.trim();
	if (!trimmed || trimmed.length > MAX_ENTRY_LENGTH) {
		throw new Error(`Entry must be 1-${MAX_ENTRY_LENGTH} characters`);
	}
	const row = db
		.prepare(
			'INSERT INTO entries (user_id, user_name, body) VALUES (?, ?, ?) RETURNING *'
		)
		.get(user.id, user.displayName, trimmed) as unknown as EntryRow;
	return toEntry(row);
}

export function deleteEntry(id: number, userID: string): boolean {
	const result = db.prepare('DELETE FROM entries WHERE id = ? AND user_id = ?').run(id, userID);
	return result.changes > 0;
}
