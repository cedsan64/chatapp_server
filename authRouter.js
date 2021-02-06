var express = require('express');
var router = express.Router();
const jwt = require("jsonwebtoken");
var db = require("./db")
const bcrypt = require('bcrypt');
const saltRounds = 10;
const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;


function checkCredidentials(email,password,username,guc=true) {
    var errorMsg={};  
    if(username.trim().length < 2) 
    {
        errorMsg.username = "invalid username"
    }
    if(!re.test(String(email).toLowerCase()))
    {
        errorMsg.email = "invalid Email"
    }
    if(password.length < 8)// && ! expressValidations.isStrongPassword(password))
    {
        errorMsg.password = "invalid password"
    }
    if(!guc)
    {
        errorMsg.guc="you must accept GUC"
    }
   return errorMsg
}


function isEmpty(params) {
    // return true si un objet est vide.
    for (const key in params) return false;
    return true
        
}

router.post("/login",(req,res) => {
    // verification de la validité des données
    let errors = checkCredidentials(req.body.email,req.body.password,"req.body.username")

    if (isEmpty(errors)) {
        // tout est valide
    db.get("SELECT username,email,password FROM customers WHERE email=?",[req.body.email],(err,data)=>{
        if (err) return res.status(500).json({status:500,error:"internal server error"});
        if (isEmpty(data)) return res.status(404).json({status:404,response:{email:"nom d'utilisateur ou mot de passe incorrect"}});
        bcrypt.compare(req.body.password,data.password).then((result)=>{
            if(result){
                const user = {email : req.body.email};
                const accessToken = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET); // todo : add expiration date
                res.status(200).json({status:200,username:data.username,token:accessToken});
            }
            else{
                res.status(404).json({status:404,response:{email:"nom d'utilisateur ou mot de passe incorrect"}});
            }
        })

    })
    } else {
        res.status(404).json({status:404,response:errors})
    }
})



router.post("/register",(req,res)=>{
    // verification de la validité des données
    let errors = checkCredidentials(req.body.email,req.body.password,req.body.username,req.body.guc)

    // TOut est OKay
    if (isEmpty(errors)) {
        db.get("SELECT email FROM customers WHERE email=?",[req.body.email],(err,data)=>{
            // verification si on a pas deja l'email ou le numero de telephone
            if (err) return res.status(500).json({status :500,response:"internal server error"});
    
            if (!isEmpty(data)) {
                console.log("email already exist");
                res.status(400).json({status:400,response:{email:"Email already exist"}})
            }
            // tout est bon, hashage du mot de passe et enregistrement dans la BDD
            bcrypt.hash(req.body.password, saltRounds).then(function(hash) {
                // Store hash in your password DB.
                let sql = "INSERT INTO customers(username,email,password) VALUES(?,?,?)";
                db.run(sql,[req.body.username.trim(),req.body.email.trim(),hash,],(err)=>{

                    if(err) return res.statut(500).json({status :500,response:"internal server error"});
                    let user = {email:req.body.email.trim()}
                    
                    const accessToken = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET)
                    res.status(200).json({status :200, username:req.body.username,token:accessToken});
                })
            }).catch(()=>{
                return res.statut(500).json({status :200,response:"internal server error"});
            });
        })
    } else {
        res.status(400).json({status:400,response:errors})
    }

})

module.exports =  router;