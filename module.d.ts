declare namespace NodeJS {
  export interface ProcessEnv {
    NODE_ENV: 'development' | 'production';
    PORT: string;
    JWT_SECRET_KEY: string;
    JWT_REFRESH_TOKEN_KEY: string;
    JWT_EXPIRES_IN: string;
    JWT_EXPIRES_IN_REFRESH: string;
    DATABASE_URL: string;
    DB_HOST: string;
    DB_DATABASE: string;
    DB_PORT: string;
    DB_ROOT_USERNAME: string;
    DB_ROOT_PASSWORD: string;
    ME_CONFIG_MONGODB_URL: string;
  }
}
