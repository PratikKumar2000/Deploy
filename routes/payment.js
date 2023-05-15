const express = require('express');
const router = express.Router();
const { requireLogin} = require("../middleware/requireLoginRole");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


router.route('/payment/process').post(
    requireLogin, (req, res) => {
        // console.log(req.body);
        stripe.paymentIntents.create({
            amount: req.body.amount,
            currency: "inr",
            metadata: {
                company : "Ecommerce",
            },
        }).then((myPayment) => {
            // console.log(myPayment);
            return res.status(200).json({
                success: true,
                client_secret : myPayment.client_secret
            });
        }).catch(err => {
            console.log(err);
        })
        
    }
);

router.route("/stripeapikey").get(requireLogin, (req, res) => {
    res.status(200).json({stripeApiKey : process.env.STRIPE_API_KEY});
})

module.exports = router;