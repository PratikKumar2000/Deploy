const mongoose = require('mongoose');
const Product = require('../models/Product');

function updateStock(id,quantity){
    Product.findById(id, async function (err, product) {
        if (err) {
            console.log(err);
            return;
        }
        product.stock -= quantity;
        await product.save({validateBeforeSave:false});
    })
}
module.exports = updateStock