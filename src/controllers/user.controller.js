import { asyncHandler } from "../utils/asynchandler.js";
import {ApiError} from "../utils/apiError.js";

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    const{fullName, email, username, password} = req.body
    console.log(fullName, email, username, password);
    
    // if(!fullName || !email || !username || !password){
    //     throw new ApiError("All fields are required", 400)
    // }
    
    if(
        [fullName, email, username, password].some(field => field?.trim() === "")
    ){
        throw new ApiError("All fields are required", 400)
    }
    User

})



export {registerUser}