import dotenv from "dotenv";
import connectDB from "../src/db/index.js";
dotenv.config({
    path: './env'
})

connectDB();
























/*
const express = requires("express");
const app = express();
(  async()=> {
    try {
       await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`)

       app.on("error", (error)=> {
        console.log("Error: ",error);
        throw error
       })

       app.listen(process.env.PORT, ()=>{
        console.log(`App is listening on port ${process.env.PORT}`);
       })
    } catch (error) {
        console.log("error",error);
        throw error
    }
})()

*/
