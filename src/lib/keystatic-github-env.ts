const requiredKeystaticGithubEnv = [
  "KEYSTATIC_GITHUB_CLIENT_ID",
  "KEYSTATIC_GITHUB_CLIENT_SECRET",
  "KEYSTATIC_SECRET",
] as const;

export function missingKeystaticGithubEnv(
  env: Record<string, string | undefined> = process.env,
) {
  return requiredKeystaticGithubEnv.filter((key) => !env[key]?.trim());
}
