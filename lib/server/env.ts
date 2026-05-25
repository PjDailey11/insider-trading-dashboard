export function getPublicApiKey(): string | undefined {
  return process.env.PUBLIC_API_KEY;
}

export function getPublicAccountId(): string | undefined {
  return process.env.PUBLIC_ACCOUNT_ID;
}

export function getSecApiKey(): string | undefined {
  return process.env.SEC_API_KEY;
}
