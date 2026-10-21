#!/usr/bin/env bash
set -euo pipefail

: "${DUCKDNS_TOKEN:?Set DUCKDNS_TOKEN in the environment (never commit it)}"
: "${DUCKDNS_APP_SUBDOMAIN:?Set the registered app subdomain label, without .duckdns.org}"
: "${DUCKDNS_MEDIA_SUBDOMAIN:?Set the registered media subdomain label, without .duckdns.org}"
ip="${DUCKDNS_IPV4:-16.144.4.15}"

for name in "$DUCKDNS_APP_SUBDOMAIN" "$DUCKDNS_MEDIA_SUBDOMAIN"; do
  [[ "$name" =~ ^[a-zA-Z0-9-]+$ ]] || { echo "Invalid DuckDNS subdomain label: $name" >&2; exit 2; }
done
[[ "$DUCKDNS_TOKEN" =~ ^[a-zA-Z0-9-]+$ ]] || { echo 'Invalid DuckDNS token format' >&2; exit 2; }
[[ "$ip" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]] || { echo 'DUCKDNS_IPV4 must be an IPv4 address' >&2; exit 2; }

# Feed the URL through curl's stdin config so the token does not appear in the
# process argument list. Use a one-shot update; a Lightsail static IP is stable.
response="$({
  printf 'url = "https://www.duckdns.org/update?domains=%s,%s&token=%s&ip=%s"\n' \
    "$DUCKDNS_APP_SUBDOMAIN" "$DUCKDNS_MEDIA_SUBDOMAIN" "$DUCKDNS_TOKEN" "$ip"
} | curl --config - --silent --show-error --fail)"

if [[ "$response" != 'OK' ]]; then
  echo "DuckDNS update did not return OK (response: ${response:0:80})" >&2
  exit 1
fi
printf 'DuckDNS updated both subdomains to %s.\n' "$ip"
