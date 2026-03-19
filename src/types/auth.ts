export interface JwtClaims {
    sub: string;
    role?: string;
    email?: string;
    type?: 'email_verification' | 'password_reset';
    iat?: number;
    exp?: number;
}

