declare const _exports: SessionRepository;
export = _exports;
declare class SessionRepository {
    findById(username: any, id: any): Promise<{
        id: any;
        title: any;
        messages: any;
        updatedAt: any;
    } | null>;
    listByUser(username: any): Promise<any>;
    save(username: any, sessionData: any): Promise<void>;
    delete(username: any, id: any): Promise<boolean>;
    updateTitle(username: any, id: any, title: any): Promise<boolean>;
    countTotal(): Promise<any>;
}
