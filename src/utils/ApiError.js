class ApiError extends Error{
    constructor(
        statusCode,
        message= "Something went wrong",
        errors = [],
        stackk = "",
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors

        if(stackk){
            this.stack = stackk
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    } 
}

export {ApiError}