class ApiError extends Error{
    constructor(
        statuscode,
        message= "Something went wrong",
        error=[],
        statck =""

   ){
    super(message)
    this.statusCode = this.statusCode
    this.data = null
    this.message = message
    this.data = null
    this.success = false;
    this.error = this.errors
    if(statck){
        this.stack = statck
    }else{
        Error.captureStackTrace(this, this.constructor)
    }
   }
}

export {ApiError}