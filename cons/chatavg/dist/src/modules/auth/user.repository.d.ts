declare const _exports: UserRepository;
export = _exports;
declare class UserRepository {
    findByUsername(username: any): Promise<any>;
    save(username: any, user: any): Promise<void>;
    delete(username: any): Promise<boolean>;
    listAll(): Promise<{}>;
    countActive(): Promise<any>;
    countExpired(): Promise<any>;
    countTotal(): Promise<any>;
    hashPassword(password: any): Promise<string>;
}
