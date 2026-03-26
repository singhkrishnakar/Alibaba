export interface UserCredential {
  email: string;
  password: string;
  role?: string; // ✅ optional for future scaling
}

export interface UserConfig {
  mode: 'single' | 'multi' | 'env';
  users: UserCredential[];
}

export const userConfig: UserConfig = {
  mode: 'single',
  users: [
    {
      email: 'pzr@innodata.com',
      password: 'Password@2029'
    }
    // Add more users if needed
  ]
};