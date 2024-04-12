const REGEX_EXCEPTION_HEADER = /^(Caused by: )?([\w\d\.]+(error|exception))(\:\s(.*))?$/i
const REGEX_EXCEPTION_STACKTRACE = /^at ([\w\d/\.]+)\.([\w\d\$]+)\.([\w\d\$<>-]+)\(([\w\d\.$ ]+)(:([\d]+))?\)/i
const REGEX_EXCEPTION_STACKTRACE_MORE = /^\.\.\. ([\d]+) more$/i

class JavaTrace {
    package: string
    class: string
    method: string
    file: string
    line: number
    constructor(_package: string, _class: string, method: string, file: string, line: number) {
        this.package = _package
        this.class = _class
        this.method = method
        this.file = file
        this.line = line
    }
}

class JavaException {
    root: boolean
    exception: string
    message: string
    trace: Array<JavaTrace>
    more: number
    critical: boolean
    constructor(exception: string, message: string, critical: boolean) {
        this.root = false
        this.exception = exception
        this.message = message
        this.trace = []
        this.more = 0
        //true when this is an error
        this.critical = critical
    }
}

class JavaExceptionGroup extends JavaException {
    subException: Array<JavaException>
    constructor(exception: string, message: string, critical: boolean) {
        super(exception, message, critical)
        this.root = true
        this.subException = []
    }
}

export const JavaStackTrace = {
    parse: (data: string) => {
        let lines = data.split('\n')
        let inTrace = false, inRoot = false, stacks = []
        let currentStack = null, currentSubStack = null
        for (let line of lines) {
            if (inTrace) {
                let more = line.trim().match(REGEX_EXCEPTION_STACKTRACE_MORE)
                if (more) {//is <... 1 more> like
                    if (inRoot) {
                        if (currentStack)
                            currentStack.more = +more[1]
                        stacks.push(currentStack)
                        currentStack = null
                    } else {
                        if (currentSubStack) {
                            currentSubStack.more = +more[1]
                            if (currentStack)
                                currentStack.subException.push(currentSubStack)
                        }
                        currentSubStack = null
                    }
                    inTrace = inRoot = false
                    continue
                } else {
                    let trace = line.trim().match(REGEX_EXCEPTION_STACKTRACE)
                    if (trace) {
                        let singleTrace = new JavaTrace(trace[1], trace[2], trace[3], trace[4], +trace[6])
                        if (inRoot && currentStack) currentStack.trace.push(singleTrace)
                        else if (currentSubStack) currentSubStack.trace.push(singleTrace)
                        continue
                    } else {
                        if (currentSubStack && currentStack) currentStack.subException.push(currentSubStack)
                        currentSubStack = null
                    }
                }
            }
            let header = line.trim().match(REGEX_EXCEPTION_HEADER)
            if (header) {
                inTrace = true
                if (header[1]) {//has <Caused by: >
                    if (currentSubStack && currentStack) currentStack.subException.push(currentSubStack)
                    currentSubStack = new JavaException(header[2], header[5], header[3].toLowerCase() == 'error')
                    inRoot = false
                } else {
                    if (currentStack) stacks.push(currentStack)
                    currentStack = new JavaExceptionGroup(header[2], header[5], header[3].toLowerCase() == 'error')
                    inRoot = true
                }
            } else {
                inTrace = false
                if (currentStack) stacks.push(currentStack)
                currentStack = null
            }
        }
        return stacks
    },
    parseFirst: (data: string) => JavaStackTrace.parse(data)[0]
}