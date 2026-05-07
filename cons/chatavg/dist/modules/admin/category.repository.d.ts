declare const _exports: CategoryRepository;
export = _exports;
declare class CategoryRepository {
    findByName(name: any): Promise<any>;
    save(name: any, category: any): Promise<void>;
    listAll(): Promise<{}>;
    countTotal(): Promise<any>;
}
