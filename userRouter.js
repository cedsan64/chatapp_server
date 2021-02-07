var express = require('express');
var router = express.Router();
var db = require("./db")

router.get('/finduser',(req,res) => {
    if (req.query.q.length == 0) {
        return res.status(200).json({status :200, data:[]});
        
    }
    var allData = {sent:[],receive:[],other:[]};
    let sql1 ="SELECT friends.status, customers.username, customers.email FROM customers LEFT JOIN friends ON customers.email=friends.receiver WHERE friends.sender='"+res.locals.user.email+"'AND (customers.username LIKE ? OR customers.email LIKE ?)"
    let sql2 ="SELECT friends.status, customers.username, customers.email FROM customers LEFT JOIN friends ON customers.email=friends.sender WHERE friends.receiver='"+res.locals.user.email+"' AND (customers.username LIKE ? OR customers.email LIKE ?)"
    let sql3 = `SELECT username, email FROM customers WHERE email not in (SELECT sender FROM friends WHERE receiver ='${res.locals.user.email}') AND email not in (SELECT receiver FROM friends WHERE sender ='${res.locals.user.email}')
                AND email != '${res.locals.user.email}' AND (username LIKE ? OR email LIKE ?)
`
    db.all(sql1,[req.query.q+"%",req.query.q+"%"],(err,data1)=>{
        if (err) return res.status(500).json({status :500,response:"internal server error"});
        allData.sent = [...data1];
        db.all(sql2,[req.query.q+"%",req.query.q+"%"],(err,data2)=>{
            if (err) return res.status(500).json({status :500,response:"internal server error"});
            allData.receive = [...data2];
            db.all(sql3,[req.query.q+"%",req.query.q+"%"],(err,data3)=>{
                if (err) return res.status(500).json({status :500,response:"internal server error"});
                allData.other = [...data3];
                res.status(200).json({status :200, data:allData});
            })
        })
    })
})



router.get('/addfriend',(req,res) => {
    if (req.query.user.length == 0 || res.locals.user.email == req.query.user) {
        return res.status(200).json({status :200, response:""});
    }
    // * check if req.query.user haven't already sent a friend request to the current user
    db.get("SELECT * FROM friends WHERE sender=? AND receiver=?",[req.query.user,res.locals.user.email],(err,data) =>{
        if (err) return res.status(500).json({status :500,response:"internal server error"});
        if(!data || data.length == 0){
            db.run("INSERT INTO friends(sender,receiver,status) VALUES(?,?,?)",[res.locals.user.email,req.query.user,'pending'],(err)=>{
                console.log(err)
                if (err) return res.status(500).json({status :500,response:"internal server error"});
                res.status(200).json({status :200, response:""});
            })
        }
        else{
            res.status(200).json({status :200, response:"Vous avez deja reçu une demande de la part de "+req.query.user}); // todo : check the status code
        }
    })
})

router.get('/acceptfriend',(req,res) => {
    if (req.query.user.length == 0 || res.locals.user.email == req.query.user) {
        return res.status(200).json({status :200, response:""});
    }
    db.run("UPDATE friends SET status=? WHERE receiver=? AND sender=?",["friends",res.locals.user.email,req.query.user],(err)=>{
        if (err) return res.status(500).json({status :500,response:"internal server error"});
        res.status(200).json({status :200, response:""});
    })
})

router.get('/removefriend',(req,res) => {
    if (req.query.user.length == 0 || res.locals.user.email == req.query.user) {
        return res.status(200).json({status :200, response:""});
    }
    db.run("DELETE FROM friends WHERE receiver=? AND sender=? OR sender=? AND receiver=? ",[res.locals.user.email,req.query.user,res.locals.user.email,req.query.user],(err)=>{
        if (err) return res.status(500).json({status :500,response:"internal server error"});
        res.status(200).json({status :200, response:""});
    })
})



function authenticate(req,res,next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
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
}

function isEmpty(params) {
    // return true si un objet est vide.
    for (const key in params) return false;
    return true
        
}


module.exports = router;