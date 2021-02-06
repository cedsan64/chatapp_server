require("dotenv").config();
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
var db = require("./db")
const bcrypt = require('bcrypt');
const saltRounds = 10;
var cors = require('cors');
var authRouter = require("./authRouter");
var userRouter = require("./userRouter");

const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

app.use(cors())
app.use(express.json());

app.use('/', authRouter);

app.use((req,res,next) =>{
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    // console.log(token);
    if(token == null) {
        return res.status(401).json({status:401,response:"token not found"})
    }
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,user)=>{
        if(err) {
            return res.status(403).json({status:403,response:"access diened"})
        }
        res.locals.user = user;
    })
    next();
})

app.get("/maindata",(req,res) => {
    
    // console.log(res.locals.user)
    db.get("SELECT username FROM customers WHERE email= ?",[res.locals.user.email],(err,data)=>{
        return res.json({username:data.username})
    })

})
app.use('/', userRouter);

app.listen(3030,()=>{
    console.log(`http://${process.env.HOSTNAME}:${process.env.PORT}`)
})