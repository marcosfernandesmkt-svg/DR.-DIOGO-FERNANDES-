// Leva os cabeçalhos de segurança para a versão em HTML: .htaccess (Apache, Hostinger,
// HostGator) e _headers (Netlify, Cloudflare Pages).
import { writeFile } from "node:fs/promises";
import { SECURITY_HEADERS } from "../../security-headers.mjs";

const out = new URL("../../out/", import.meta.url);
const apache = SECURITY_HEADERS.map(({ key, value }) => `  Header always set ${key} "${value}"`).join("\n");
await writeFile(new URL(".htaccess", out), `Options -Indexes\nErrorDocument 404 /404.html\n<IfModule mod_headers.c>\n${apache}\n</IfModule>\n`);
await writeFile(new URL("_headers", out), `/*\n${SECURITY_HEADERS.map(({ key, value }) => `  ${key}: ${value}`).join("\n")}\n`);
