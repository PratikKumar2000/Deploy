const jwt = require('jsonwebtoken');
const User = require('../models/User');

function requireLogin(req,res,next) {
    const {token} = req.cookies;
    // console.log(token);
    if(!token){
        return res.status(401).json({error:"you must be logged in to excess this resource"});
    }
    jwt.verify(token,process.env.JWT_SECRET, (err,user) => {
        if(err){
            return res.status(401).json({error:"you must be logged in to excess this resource"});
        }
        const {_id} = user;
        User.findById(_id, function (err, userdata) {
            if(err){
                return res.status(500).json("Internal Server Error");
            }
            if(!userdata){
                return res.status(401).json({error:"you must be signed up to excess this resource"});
            }
            req.user = userdata;
            next();
       });

    });
}
function admin(...role_user){
    return (req,res,next) => {
        // console.log(req.user);
        if(role_user.includes(req.user.role)){
            return res.status(403).json({error:"Only admin are allowed to access the resource"});
        }
        next();
    }
}
module.exports = {requireLogin,admin};