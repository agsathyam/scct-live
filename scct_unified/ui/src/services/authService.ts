// SIMPLE DEMO AUTH
// No external dependencies. Just simulates a login for the demo experience.

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

const DEMO_USER: User = {
  uid: 'demo-user-001',
  email: 'demo@example.com',
  displayName: 'Demo User',
  photoURL: null
};

export const signInWithGoogle = async (): Promise<User> => {
  console.log("Signing in (Demo Mode)...");
  localStorage.setItem('scct_demo_user', JSON.stringify(DEMO_USER));
  // Simulate network delay for realism
  await new Promise(resolve => setTimeout(resolve, 500));
  return DEMO_USER;
};

export const logout = async (): Promise<void> => {
  console.log("Signing out...");
  localStorage.removeItem('scct_demo_user');
  window.location.reload();
};

export const getAuthToken = async (): Promise<string | null> => {
  return "demo-token";
};

// Check if already logged in on load
export const checkAutoLogin = (): User | null => {
  const stored = localStorage.getItem('scct_demo_user');
  if (stored) return JSON.parse(stored);
  return null;
};
