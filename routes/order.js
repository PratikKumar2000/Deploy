const Order = require("../models/Order");
const Product = require("../models/Product");
const express = require("express");
const router = express.Router();
const { requireLogin, admin } = require("../middleware/requireLoginRole");
const updateStock = require("../updateStock/updateStock");

router.post("/order/newOrder", requireLogin, (req, res) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;
  const order = new Order({
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paidAt: Date.now(),
    user: req.user._id,
  });
  // console.log(order);
  order
    .save()
    .then((result) => {
      res.status(200).json({ message: "success", order });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.get("/order/getOrders", requireLogin, (req, res) => {
  Order.find({ user: req.user._id }, (err, orders) => {
    if (err) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
    if (!orders) {
      return res.status(404).json({ error: "There are no orders made" });
    }
    return res.status(200).json(orders);
  });
});

router.get("/order/:id", requireLogin, (req, res) => {
  Order.findById(req.params.id)
    .populate("user", "name email")
    .exec((err, order) => {
      if (err) {
        return res.status(500).json({ error: "Internal Server Error" });
      }
      if (!order) {
        return res.status(404).json({ error: "Order does not exist" });
      }
      return res.status(200).json(order);
    });
});

router.get(
  "/order/admin/getOrders",
  requireLogin,
  admin("user"),
  async (req, res) => {
    try {
      const orders = await Order.find();
      let totalAm = 0;
      orders.forEach((order) => (totalAm += order.totalPrice));
      res.status(200).json({ orders, totalAm });
    } catch (err) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.put(
  "/order/admin/updateOrder/:id",
  requireLogin,
  admin("user"),
  (req, res) => {
    //   console.log(req.body);
    Order.findById({ _id: req.params.id })
      .then((order) => {
        if (!order) {
          return res.status(404).json({ error: "Order does not exist" });
          }
        if (order.orderStatus === "Delivered") {
          return res.status(400).json({ error: "Order is already delivered!" });
          }
        req.body.status ==='Shipped' && order.orderItems.forEach( (item) => {
           updateStock(item.product, item.quantity);
        });
          order.orderStatus = req.body.status;
        if (req.body.status === "Delivered") {
          order.deliveredAt = Date.now();
          }
        order
          .save({ validateBeforeSave: false })
          .then((order) => {
            res.status(200).json({ message: "success",order : order});
          })
          .catch((err) => {
            res.status(500).json({ error: "Internal Server Error" });
          });
      })
      .catch((err) => {
        return res.status(500).json({ error: "Internal server error" });
      });
  }
);

router.delete(
  "/order/admin/deleteOrder/:id",
  requireLogin,
  admin("user"),
  async (req, res) => {
    const order = await Order.find({ _id: req.params.id });
    if (!order) {
      return res.status(404).json({ error: "There are no orders made" });
    }
    await Order.deleteOne(order._id);
    res.status(200).json({ message: "deleted the order successfully" });
  }
);

module.exports = router;
