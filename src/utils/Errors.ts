export class BaseError extends Error {
    message: string
    name: string
    stack: string

    constructor(message?: string) {
        super(message)
    }
}


