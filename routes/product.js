const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Product = require("../models/Product");
const { search, filter } = require("../Search/queryFilterAndPagination");
const { requireLogin, admin } = require("../middleware/requireLoginRole");
const cloudinary = require("cloudinary");

router.route("/products").get(async (req, res, next) => {
  const s = search(req.query.search);
  const f = filter(req.query);
  const newQuery = { ...s, ...f };
  const NumberOfProducts = await Product.countDocuments();
  var sections =
    NumberOfProducts % process.env.ITEMS == 0
      ? NumberOfProducts / process.env.ITEMS
      : NumberOfProducts / process.env.ITEMS + 1;
  sections = Math.floor(sections);
  const value = process.env.ITEMS;
  // console.log(newQuery);
  Product.find(newQuery)
    .then((product) =>
      res.status(200).json({ product, NumberOfProducts, value, sections })
    )
    .catch((err) => {
      return res.status(404).json({ error: "Products not found" });
    });
});

router.route("/product/:id").get(async (req, res, next) => {
  const id = req.params.id;
  Product.findById(id)
    .populate("comments.postedBy")
    .then((product) => res.status(200).json({ product }))
    .catch((err) => {
      return res.status(404).json({ error: "product not available" });
    });
});

router.post(
  "/product/newProduct",
  requireLogin,
  admin("user"),
  async (req, res, next) => {
    req.body.user = req.user._id;
    let images = [];
    if (typeof req.body.pics === "string") {
      images.push(req.body.pics);
    } else {
      images = req.body.pics;
    }
    const imagesLink = [];
    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.v2.uploader.upload(images[i], {
        folder: "products",
      });
      imagesLink.push({
        p_id: result.public_id,
        url: result.secure_url,
      });
    }
    req.body.pics = imagesLink;
    await Product.create(req.body, function (err, product) {
      if (err) {
        console.log(err);
        return res
          .status(404)
          .json({ error: "Unsuccessful in creating the new product" });
      }
      product
        .save()
        .then((result) => {
          return res.json({ product: result });
        })
        .catch((err) => {
          return res.status(500).json({ error: "Internal Server Error" });
        });
    });
  }
);

router
  .route("/product/:id")
  .put(requireLogin, admin("user"), async (req, res, next) => {
    const id = req.params.id;
    const product = Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "product not found" });
    }
    let images = [];
    if (typeof req.body.pics === "string") {
      images.push(req.body.pics);
    } else {
      images = req.body.pics;
    }
    try {
      if (images !== undefined && product.pics) {
        for (let i = 0; i < product.pics.length; i++) {
          await cloudinary.v2.uploader.destroy(product.pics[i].p_id);
        }
      }
    } catch (err) {
      console.log(err);
    }
    const imagesLink = [];
    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.v2.uploader.upload(images[i], {
        folder: "products",
      });
      imagesLink.push({
        p_id: result.public_id,
        url: result.secure_url,
      });
    }
    req.body.pics = imagesLink;
    try {
      const pro = await Product.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });
      return res.status(200).json({ product: pro });
    } catch (err) {
      return res.status(500).json({ error: "internal server error" });
    }
  });

router
  .route("/product/deleteProduct/:id")
  .delete(requireLogin, admin("user"), (req, res, next) => {
    const id = req.params.id;
    Product.findById(id, async function (err, product) {
      if (err) {
        return res.status(500).json("Product not found");
      }
      try {
        for (let i = 0; i < product.pics.length; i++) {
          await cloudinary.v2.uploader.destroy(product.pics[i].p_id);
        }
        await product.remove();
      } catch (err) {
        console.log(err);
      }
      res.status(200).json({ message: "Product removed successfully" });
    });
  });

router.route("/product/review/like").put(requireLogin, (req, res) => {
  const { productId } = req.body;
  Product.findById(productId, function (err, product) {
    if (err) {
      return res.status(500).json("Internal Server Error");
    }
    if (!product) {
      return res.status(404).json("Product not found");
    }
    const likeArr = product.likes;
    let found = false;
    likeArr.forEach((id) => {
      if (id.toString() === req.user._id.toString()) found = true;
    });
    if (!found) {
      product.likes.push(req.user._id);
      product.save();
      res.status(200).json(product);
    } else {
      res.status(200).json({ check: "Already placed the like" });
    }
  });
});
router.route("/product/review/unlike").put(requireLogin, (req, res) => {
  const { productId } = req.body;
  Product.findByIdAndUpdate(
    productId,
    {
      $pull: { likes: req.user._id },
    },
    { new: true }
  )
    .populate("comments.postedBy")
    .exec((err, result) => {
      if (err) {
        return res.status(422).json({ error: err });
      } else {
        res.status(200).json(result);
      }
    });
});
router.route("/product/review/comment").put(requireLogin, async (req, res) => {
  const comment = {
    text: req.body.text,
    postedBy: req.user._id,
  };
  try {
    const product = await Product.findById(req.body.productId).populate(
      "comments.postedBy"
    );
    const isCommented = product.comments.find(
      (comm) => comm.postedBy._id.toString() === req.user._id.toString()
    );
    if (isCommented) {
      product.comments.forEach((comm) => {
        if (comm.postedBy._id.toString() === req.user._id.toString()) {
          comm.text = req.body.text;
        }
      });
    } else {
      product.comments.push(comment);
    }
    const pro = await product.save();
    res.status(200).json(pro);
  } catch (err) {
    console.log(err);
  }
});

router
  .route("/product/review/deleteComment")
  .put(requireLogin, async (req, res) => {
    const id = req.user._id;
    const { productId } = req.body;
    Product.findOne({ _id: productId }, function (err, product) {
      if (err) {
        console.log(err);
        return;
      }
      if (!product) {
        return res.status(404).json("product not found");
      }
      const commentArr = product.comments;
      const newCommentArr = [];
      // console.log(commentArr)
      commentArr.forEach((comment) => {
        if (comment.postedBy.toString() !== id.toString()) {
          newCommentArr.push(comment);
        }
      });
      // console.log(newCommentArr);
      product.comments = newCommentArr;
      product
        .save()
        .then((response) => {
          res.status(200).json("deleted the comment successfully");
        })
        .catch((errr) => {
          res.status(500).json("error while deleting the comment");
        });
    });
  });
router
  .route("/product/admin/review/Comment")
  .post(requireLogin, admin("user"), async (req, res) => {
    const { productId } = req.body;
    Product.findById(productId)
      .populate("comments.postedBy")
      .then((product) => {
        if (!product) {
          return res.status(404).json({ error: "product not found" });
        } else {
          return res.status(200).json({
            comments: product.comments,
            message: product.comments.length,
          });
        }
      })
      .catch((err) => {
        res.json(500).json({ error: "internal server error" });
      });
  });
router
  .route("/product/admin/review/deleteComment")
  .delete(requireLogin, admin("user"), async (req, res) => {
    const id = req.body.id;
    // console.log(id)
    const { productId } = req.body;
    Product.findOne({ _id: productId }, function (err, product) {
      if (err) {
        console.log(err);
        return;
      }
      if (!product) {
        return res.status(404).json("product not found");
      }
      const commentArr = product.comments;
      const newCommentArr = [];
      commentArr.forEach((comment) => {
        // console.log(comment.postedBy.toString());
        if (comment.postedBy.toString() !== id) {
          newCommentArr.push(comment);
        }
      });
      product.comments = newCommentArr;
      product
        .save()
        .then((response) => {
          res
            .status(200)
            .json({
              comments: newCommentArr,
              message: "deleted the comment successfully",
            });
        })
        .catch((errr) => {
          res.status(500).json({ error: "error while deleting the comment" });
        });
    });
  });

module.exports = router;
