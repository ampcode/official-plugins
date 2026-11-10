#!/usr/bin/env bash
# Registers a Sign in with Amp client for a Box deployment and stores its credentials as
# deployment secrets, without the client secret ever reaching stdout, a log, or the transcript.
#
# Usage: configure-sign-in.sh <namespace>/<box> <deployment> <workspace> [<deployment URL>]
#   <workspace> is the Amp workspace that owns the OAuth client (its admins manage it).
#   <deployment URL> defaults to https://<deployment>--<namespace>.onamp.dev/.
#   The deployment must already exist: run the first `amp boxes deploy` before this script.
#   Run it on the user's own machine. In an orb, Amp refuses `amp oauth-clients create` and
#   `amp secrets set`; use manage_amp there, as reference/sign-in-with-amp.md describes.
#
# Sets deployment variables: AMP_OAUTH_CLIENT_ID (env), AMP_OAUTH_CLIENT_SECRET (secret),
# APP_SESSION_SECRET (secret). Prints the client ID, the redirect URI, and the manage URL.
set -euo pipefail
umask 077

usage="usage: configure-sign-in.sh <namespace>/<box> <deployment> <workspace> [<deployment URL>]"
box="${1:?$usage}"
deployment="${2:?$usage}"
workspace="${3:?$usage}"
namespace="${box%%/*}"
if [[ -z "$namespace" || "$namespace" == "$box" || -z "${box#*/}" ]]; then
	echo "expected <namespace>/<box>, got: $box" >&2
	exit 2
fi
deployment_url="${4:-https://${deployment}--${namespace}.onamp.dev/}"
redirect_uri="${deployment_url%/}/auth/callback"

scratch="$(mktemp -d)"
trap 'rm -rf "$scratch"' EXIT

# Fail before creating a client if the deployment is missing or Boxes are not enabled.
if ! amp secrets list --box "$box" --deployment "$deployment" >/dev/null 2>"$scratch/stderr"; then
	echo "Cannot read secrets for deployment $deployment on $box. Deploy it first." >&2
	cat "$scratch/stderr" >&2
	exit 1
fi

amp oauth-clients create \
	--type server \
	--workspace "$workspace" \
	--name "$deployment" \
	--description "Sign in with Amp for ${deployment_url}" \
	--redirect-uri "$redirect_uri" >"$scratch/client.txt"

client_id="$(sed -n 's/^Client ID: //p' "$scratch/client.txt" | head -n1)"
manage_url="$(sed -n 's/^Manage: //p' "$scratch/client.txt" | head -n1)"
sed -n 's/^Client Secret: //p' "$scratch/client.txt" | head -n1 | tr -d '\n' >"$scratch/secret"
if [[ -z "$client_id" || ! -s "$scratch/secret" ]] || grep -q '^none\|^not created' "$scratch/secret"; then
	echo "amp oauth-clients create did not return a client ID and secret:" >&2
	grep -v '^Client Secret:' "$scratch/client.txt" >&2
	exit 1
fi

# `amp secrets set` prints a "# Redeploy the Box" hint on stderr; keep stderr quiet unless it fails.
store() {
	if ! amp secrets set "$@" --box "$box" --deployment "$deployment" --data-file - \
		>/dev/null 2>"$scratch/stderr"; then
		cat "$scratch/stderr" >&2
		echo "The OAuth client $client_id was created. Do not create another; store the rest by hand." >&2
		exit 1
	fi
}
printf '%s' "$client_id" | store AMP_OAUTH_CLIENT_ID --env
store AMP_OAUTH_CLIENT_SECRET --secret <"$scratch/secret"
head -c 48 /dev/urandom | base64 | tr -d '\n' | store APP_SESSION_SECRET --secret

cat <<EOF
Configured Sign in with Amp for deployment $deployment on $box
Client ID:    $client_id
Redirect URI: $redirect_uri
Manage:       $manage_url
Stored deployment variables: AMP_OAUTH_CLIENT_ID (env), AMP_OAUTH_CLIENT_SECRET (secret), APP_SESSION_SECRET (secret)
Redeploy to apply them: amp boxes deploy
EOF
