function unavailable() {
  throw new Error('Sign in from the UFitness login screen.');
}

export async function signUp() {
  unavailable();
}

export async function logIn() {
  unavailable();
}

export async function logOut() {}

export function subscribeToAuthChanges(onChange) {
  onChange(null);
  return () => {};
}
