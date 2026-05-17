import { Octokit } from "@octokit/rest";

export const createOctokit = (token: string) =>
  new Octokit({
    auth: token,
  });
