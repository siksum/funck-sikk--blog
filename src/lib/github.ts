const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_REPO_OWNER || 'siksum';
const GITHUB_REPO = process.env.GITHUB_REPO_NAME || 'funck-sikk--blog';
const BRANCH = 'main';

interface GitHubFile {
  path: string;
  content: string;
}

async function githubApi(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
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
  try {
    const data = await githubApi(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${BRANCH}`);
    return data.sha;
  } catch {
    return null;
  }
}

async function getLatestCommitSha(): Promise<string> {
  const data = await githubApi(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/ref/heads/${BRANCH}`);
  return data.object.sha;
}

async function getTreeSha(commitSha: string): Promise<string> {
  const data = await githubApi(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/commits/${commitSha}`);
  return data.tree.sha;
}

export async function commitFile(file: GitHubFile, message: string): Promise<boolean> {
  if (!GITHUB_TOKEN) {
    console.error('GITHUB_TOKEN is not set');
    return false;
  }

  try {
    const existingSha = await getFileSha(file.path);
    const encodedContent = Buffer.from(file.content).toString('base64');

    await githubApi(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${file.path}`, {
      method: 'PUT',
      body: JSON.stringify({
        message,
        content: encodedContent,
        branch: BRANCH,
        ...(existingSha && { sha: existingSha }),
      }),
    });

    return true;
  } catch (error) {
    console.error('Failed to commit file:', error);
    return false;
  }
}

export async function deleteFile(path: string, message: string): Promise<boolean> {
  if (!GITHUB_TOKEN) {
    console.error('GITHUB_TOKEN is not set');
    return false;
  }

  try {
    const sha = await getFileSha(path);
    if (!sha) {
      console.error('File not found:', path);
      return false;
    }

    await githubApi(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
      method: 'DELETE',
      body: JSON.stringify({
        message,
        sha,
        branch: BRANCH,
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
  if (!GITHUB_TOKEN) {
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

    const newTree = await githubApi(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree,
      }),
    });

    const newCommit = await githubApi(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        tree: newTree.sha,
        parents: [latestCommitSha],
      }),
    });

    await githubApi(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs/heads/${BRANCH}`, {
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
