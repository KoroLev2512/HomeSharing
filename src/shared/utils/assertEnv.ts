class EnvError extends Error {}

export const assertEnv = (key: unknown): asserts key is string => {
  if (!(typeof key === 'string')) {
    throw new EnvError(`Environment variable ${key} is undefined`)
  }
}