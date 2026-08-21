class ApiResponse{
    constructor(statusCode, data, massage = "Success"){
        this.StatusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}