export interface UserCredentials {
    email: string;
    password: string;
}

export const credentials: UserCredentials = {
    email: process.env.TEST_EMAIL || '',
    password: process.env.TEST_PASSWORD || ''
};