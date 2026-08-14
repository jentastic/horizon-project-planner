// GitHub repo as database. All functions are server-only.
// Env: GITHUB_TOKEN (fine-grained PAT, contents read/write on the data repo),
//      GITHUB_REPO ("owner/name"), GITHUB_BRANCH (optional, default "main").

const API = "https://api.github.com";

function cfg() {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  if (!repo || !token) throw new Error("GITHUB_REPO / GITHUB_TOKEN not configured");
  return { repo, token, branch: process.env.GITHUB_BRANCH || "main" };
}

async function gh(path, options = {}) {
  const { token } = cfg();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
  return res;
}

export async function getFile(path) {
  const { repo, branch } = cfg();
  const res = await gh(`/repos/${repo}/contents/${path}?ref=${branch}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub read failed (${res.status}) for ${path}`);
  const data = await res.json();
  const text = Buffer.from(data.content, "base64").toString("utf-8");
  return { json: JSON.parse(text), sha: data.sha };
}

export async function putFile(path, json, message, sha) {
  const { repo, branch } = cfg();
  const body = {
    message,
    branch,
    content: Buffer.from(JSON.stringify(json, null, 2)).toString("base64"),
  };
  if (sha) body.sha = sha;
  const res = await gh(`/repos/${repo}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GitHub write failed (${res.status}) for ${path}: ${t}`);
  }
  return res.json();
}

export async function deleteFile(path, message, sha) {
  const { repo, branch } = cfg();
  const res = await gh(`/repos/${repo}/contents/${path}`, {
    method: "DELETE",
    body: JSON.stringify({ message, branch, sha }),
  });
  if (!res.ok) throw new Error(`GitHub delete failed (${res.status}) for ${path}`);
  return res.json();
}

export async function listDir(path) {
  const { repo, branch } = cfg();
  const res = await gh(`/repos/${repo}/contents/${path}?ref=${branch}`);
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub list failed (${res.status}) for ${path}`);
  const data = await res.json();
  return Array.isArray(data) ? data.filter((f) => f.name.endsWith(".json")) : [];
}

export async function readAllInDir(dir) {
  const entries = await listDir(dir);
  const files = await Promise.all(
    entries.map(async (e) => {
      const f = await getFile(`${dir}/${e.name}`);
      return f ? f.json : null;
    })
  );
  return files.filter(Boolean);
}

// ---- Binary file support (attachments) ----

export async function putBinaryFile(path, base64, message) {
  const { repo, branch } = cfg();
  // If the file already exists we need its sha to overwrite
  const head = await gh(`/repos/${repo}/contents/${path}?ref=${branch}`);
  let sha;
  if (head.ok) sha = (await head.json()).sha;
  const body = { message, branch, content: base64 };
  if (sha) body.sha = sha;
  const res = await gh(`/repos/${repo}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GitHub upload failed (${res.status}): ${t}`);
  }
  return res.json();
}

export async function listDirRaw(path) {
  const { repo, branch } = cfg();
  const res = await gh(`/repos/${repo}/contents/${path}?ref=${branch}`);
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub list failed (${res.status}) for ${path}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function getBlobRaw(sha) {
  const { repo } = cfg();
  const res = await gh(`/repos/${repo}/git/blobs/${sha}`, {
    headers: { Accept: "application/vnd.github.raw+json" },
  });
  if (!res.ok) throw new Error(`GitHub blob fetch failed (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}
