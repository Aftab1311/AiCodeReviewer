import { createOctokit } from "@/lib/github/octokit";

export async function fetchPullRequestDiff(input: {
  token: string;
  owner: string;
  repo: string;
  pullNumber: number;
}) {
  const octokit = createOctokit(input.token);
  const response = await octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}", {
    owner: input.owner,
    repo: input.repo,
    pull_number: input.pullNumber,
    mediaType: { format: "diff" },
  });

  return String(response.data);
}
