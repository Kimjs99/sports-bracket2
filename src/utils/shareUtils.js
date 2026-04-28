import LZString from 'lz-string';

export function encodeTournament(data) {
  try {
    return LZString.compressToEncodedURIComponent(JSON.stringify(data));
  } catch {
    return null;
  }
}

export function decodeTournament(str) {
  try {
    const json = LZString.decompressFromEncodedURIComponent(str);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

export function buildShareUrl(tournament) {
  const encoded = encodeTournament(tournament);
  if (!encoded) return null;
  return `${location.origin}${location.pathname}?t=${encoded}`;
}

export function readShareParam() {
  const t = new URLSearchParams(location.search).get('t');
  return t ? decodeTournament(t) : null;
}

export function clearShareParam() {
  const url = new URL(location.href);
  url.searchParams.delete('t');
  history.replaceState(null, '', url.toString());
}
