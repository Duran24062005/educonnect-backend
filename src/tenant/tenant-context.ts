import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantScope {
    institutionId: string;
    enforce: boolean;
}

const storage = new AsyncLocalStorage<TenantScope | null>();

export const runTenantRequest = (callback: () => void): void => {
    storage.run(null, callback);
};

export const enterTenantScope = (scope: TenantScope): void => {
    storage.enterWith(scope);
};

export const getTenantScope = (): TenantScope | null => storage.getStore() || null;

export const runWithTenantScope = async <T>(scope: TenantScope, callback: () => Promise<T>): Promise<T> => (
    storage.run(scope, callback)
);
