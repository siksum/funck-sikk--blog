// Read environment variables at runtime (not build time)
const getGithubConfig = () => ({
  token: process.env.GITHUB_TOKEN,
  owner: process.env.GITHUB_REPO_OWNER || 'siksum',
  repo: process.env.GITHUB_REPO_NAME || 'funck-sikk--blog',
  branch: 'main',
});

interface GitHubFile {
  path: string;
  content: string;
}

async function githubApi(endpoint: string, options: RequestInit = {}) {
  const { token } = getGithubConfig();
  const res = await fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`GitHub API error: ${res.status} - ${error}`);
  }

  return res.json();
}

async function getFileSha(path: string): Promise<string | null> {
  const { owner, repo, branch } = getGithubConfig();
  try {
    const data = await githubApi(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
    return data.sha;
  } catch {
    return null;
  }
}

// Read file content from GitHub
export async function getFileContent(path: string): Promise<string | null> {
  const { token, owner, repo, branch } = getGithubConfig();
  if (!token) {
    return null;
  }

  try {
    const data = await githubApi(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
    // GitHub returns base64 encoded content
    const content = Buffer.from(data.content, 'base64').toString('utf8');
    return content;
  } catch {
    return null;
  }
}

// List files in a directory from GitHub
export async function listFiles(dirPath: string): Promise<string[] | null> {
  const { token, owner, repo, branch } = getGithubConfig();
  if (!token) {
    return null;
  }

  try {
    const data = await githubApi(`/repos/${owner}/${repo}/contents/${dirPath}?ref=${branch}`);
    if (Array.isArray(data)) {
      return data
        .filter((item: { type: string; name: string }) => item.type === 'file' && item.name.endsWith('.mdx'))
        .map((item: { name: string }) => item.name);
    }
    return null;
  } catch {
    return null;
  }
}

async function getLatestCommitSha(): Promise<string> {
  const { owner, repo, branch } = getGithubConfig();
  const data = await githubApi(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
  return data.object.sha;
}

async function getTreeSha(commitSha: string): Promise<string> {
  const { owner, repo } = getGithubConfig();
  const data = await githubApi(`/repos/${owner}/${repo}/git/commits/${commitSha}`);
  return data.tree.sha;
}

export async function commitFile(file: GitHubFile, message: string): Promise<boolean> {
  const { token, owner, repo, branch } = getGithubConfig();
  console.log('[commitFile] Config:', { hasToken: !!token, owner, repo, branch, path: file.path });

  if (!token) {
    console.error('[commitFile] GITHUB_TOKEN is not set');
    return false;
  }

  try {
    const existingSha = await getFileSha(file.path);
    console.log('[commitFile] Existing SHA:', existingSha);
    const encodedContent = Buffer.from(file.content).toString('base64');

    await githubApi(`/repos/${owner}/${repo}/contents/${file.path}`, {
      method: 'PUT',
      body: JSON.stringify({
        message,
        content: encodedContent,
        branch: branch,
        ...(existingSha && { sha: existingSha }),
      }),
    });

    console.log('[commitFile] Success');
    return true;
  } catch (error) {
    console.error('[commitFile] Failed:', error);
    return false;
  }
}

export async function deleteFile(path: string, message: string): Promise<boolean> {
  const { token, owner, repo, branch } = getGithubConfig();
  if (!token) {
    console.error('GITHUB_TOKEN is not set');
    return false;
  }

  try {
    const sha = await getFileSha(path);
    if (!sha) {
      console.error('File not found:', path);
      return false;
    }

    await githubApi(`/repos/${owner}/${repo}/contents/${path}`, {
      method: 'DELETE',
      body: JSON.stringify({
        message,
        sha,
        branch: branch,
      }),
    });

    return true;
  } catch (error) {
    console.error('Failed to delete file:', error);
    return false;
  }
}

export async function commitMultipleFiles(
  files: GitHubFile[],
  message: string
): Promise<boolean> {
  const { token, owner, repo, branch } = getGithubConfig();
  if (!token) {
    console.error('GITHUB_TOKEN is not set');
    return false;
  }

  try {
    const latestCommitSha = await getLatestCommitSha();
    const baseTreeSha = await getTreeSha(latestCommitSha);

    const tree = files.map((file) => ({
      path: file.path,
      mode: '100644' as const,
      type: 'blob' as const,
      content: file.content,
    }));

    const newTree = await githubApi(`/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree,
      }),
    });

    const newCommit = await githubApi(`/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        tree: newTree.sha,
        parents: [latestCommitSha],
      }),
    });

    await githubApi(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      body: JSON.stringify({
        sha: newCommit.sha,
      }),
    });

    return true;
  } catch (error) {
    console.error('Failed to commit multiple files:', error);
    return false;
  }
}
