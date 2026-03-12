export interface UserCredential {
  email: string;
  password: string;
}

export interface UserConfig {
  mode: 'single' | 'multi';
  users: UserCredential[];
}

export const userConfig: UserConfig = {
  mode: 'single', // change to 'single' if same user for all workers
  users: [
    {
      email: 'pzr@innodata.com',
      password: 'Password@2029'
    }/*,
    {
      email: 'pzr1@innodata.com',
      password: 'Password@2029'
    }*/
  ]
};