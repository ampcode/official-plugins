import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { addEntry, deleteEntry, listEntries, MAX_ENTRY_LENGTH } from '$lib/server/db';

export const load: PageServerLoad = () => {
	return { entries: listEntries(), maxLength: MAX_ENTRY_LENGTH };
};

export const actions: Actions = {
	post: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Sign in to post.' });
		const body = String((await request.formData()).get('body') ?? '');
		if (!body.trim() || body.trim().length > MAX_ENTRY_LENGTH) {
			return fail(400, { error: `Write between 1 and ${MAX_ENTRY_LENGTH} characters.`, body });
		}
		addEntry(locals.user, body);
		return { ok: true };
	},
	delete: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Sign in first.' });
		const id = Number((await request.formData()).get('id'));
		if (!Number.isInteger(id) || !deleteEntry(id, locals.user.id)) {
			return fail(404, { error: 'That entry is gone or not yours.' });
		}
		return { ok: true };
	}
};
