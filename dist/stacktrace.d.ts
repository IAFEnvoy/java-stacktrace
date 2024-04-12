declare class JavaTrace {
    package: string;
    class: string;
    method: string;
    file: string;
    line: number;
    constructor(_package: string, _class: string, method: string, file: string, line: number);
}
declare class JavaException {
    root: boolean;
    exception: string;
    message: string;
    trace: Array<JavaTrace>;
    more: number;
    critical: boolean;
    constructor(exception: string, message: string, critical: boolean);
}
declare class JavaExceptionGroup extends JavaException {
    subException: Array<JavaException>;
    constructor(exception: string, message: string, critical: boolean);
}
export declare const JavaStackTrace: {
    parse: (data: string) => (JavaExceptionGroup | null)[];
    parseFirst: (data: string) => JavaExceptionGroup | null;
};
export {};
//# sourceMappingURL=stacktrace.d.ts.map