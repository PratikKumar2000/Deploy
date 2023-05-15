const mongoose = require('mongoose');
const User = require("../models/User");

const productSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    description: {
        type : String,
        required : true
    },
    price: {
        type: Number,
        required:true
    },
    pics : [
       {
            p_id : {
                type : String,
                required: true
            },
            url: {
                type:String,
                default:"https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
            }
       }
    ],
    category : {
        type : String,
        required : true
    },
    stock: {
        type: Number,
        required : true,
        default : 1
    },
    likes:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}],
    comments:[{
        text:String,
        postedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User"}
    }],
    user:{
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    createdAt: {
        type : Date,
        default: Date.now()
    }
});

module.exports = mongoose.model('Product',productSchema);