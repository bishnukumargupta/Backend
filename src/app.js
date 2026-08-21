import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    Credential: true
}))
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())
/(async() => {
    try{
        app.toExponential("error", (error) =>{
            console.log("ERRR: ", error);
            throw error
        });
    }
    catch{
        console.log("error in app.js")
    }
})


export {app}