const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { requireLogin, admin } = require("../middleware/requireLoginRole");
const cloudinary = require("cloudinary");

router.get("/user/profile", requireLogin, (req, res) => {
  // console.log(req.user._id);
  User.findById(req.user._id, function (err, userdata) {
    // console.log(userdata);
    if (err) {
      return res.status(500).json("Internal Server Error");
    }
    // console.log("hello");
    res.status(200).json({ user: userdata });
  });
});

router.put("/user/modifyPassword", requireLogin, async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (!oldPassword || !newPassword || !confirmPassword) {
    return res.status(422).json({ error: "please provide all the details" });
  }
  User.findOne({ _id: req.user._id })
    .select("+password")
    .then((user) => {
      bcrypt.compare(oldPassword, user.password).then((doMatch) => {
        if (!doMatch) {
          return res.status(400).json({ error: "Old password is incorrect" });
        }
      });
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: "Password does not match" });
      }
      bcrypt.hash(newPassword, 12).then((hashedpassword) => {
        user.password = hashedpassword;
        user.save({ validateBeforeSave: false }).then((saveduser) => {
          res
            .status(200)
            .json({ message: "password updated success", user: saveduser });
        });
      });
    });
});

router.put("/user/updateProfile", requireLogin, (req, res) => {
  const userdetails = {
    name: req.body.name,
    email: req.body.email,
  };
  console.log(req.body);
  //cloudinary change
  if (req.body.pic !== "") {
    User.findById(req.user._id)
      .then((result) => {
        if (result) {
          const imageId = result.pic.p_id;
          cloudinary.v2.uploader
            .destroy(imageId)
            .then((res) => {
              console.log(res);
            })
            .catch((err) => {
              console.log({ error: err });
            });
          cloudinary.v2.uploader
            .upload(req.body.pic, {
              folder: "ecommerce",
              width: 150,
              crop: "scale",
            })
            .then((my_cloud) => {
              userdetails.pic = {
                p_id: my_cloud.public_id,
                url: my_cloud.secure_url,
              };
              User.findByIdAndUpdate(req.user._id, userdetails, {
                new: true,
                runValidators: true,
              })
                .then((userdata) => {
                  return res.status(200).json({ user: userdata });
                })
                .catch((err) => {
                  return res.status(500).json({ error: err });
                });
            })
            .catch((err) => {
              res.status(422).json({ error: err });
            });
        }
      })
      .catch((err) => {
        res.status(500).json({ error: err });
      });
  } else {
    User.findByIdAndUpdate(req.user._id, userdetails, {
      new: true,
      runValidators: true,
    })
      .then((userdata) => {
        return res.status(200).json({ user: userdata });
      })
      .catch((err) => {
        return res.status(500).json({ error: err });
      });
  }
});

router.get("/user/admin/getUsers", requireLogin, admin("user"), (req, res) => {
  User.find()
    .then((users) => {
      res.status(200).json({ users });
    })
    .catch((err) => {
      res.status(404).json({error : err });
    });
});

router.get(
  "/user/admin/getUser/:id",
  requireLogin,
  admin("user"),
  async (req, res) => {
    const user = await User.findOne({ _id: req.params.id });
    if (!user) {
      return res.status(402).json({ error: "User does not exist" });
    }
    res.status(200).json({ user });
  }
);

router.put(
  "/user/admin/updateUserProfile/:id",
  requireLogin,
  admin("user"),
  (req, res) => {
    const userdetails = {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
    };
    User.findByIdAndUpdate(req.params.id, userdetails, {
      new: true,
      runValidators: true,
    })
      .then((userdata) => {
        return res.status(200).json({ user: userdata });
      })
      .catch((err) => {
        return res.status(500).json({error : err});
      });
  }
);

router.delete(
  "/user/admin/deleteUser/:id",
  requireLogin,
  admin("user"),
  async (req, res) => {
    try {
      const user = await User.findOne({ _id: req.params.id });
    if (!user) {
      return res.status(402).json({ error: "User does not exist" });
    }
    const imageId = user.pic.p_id;
    await cloudinary.v2.uploader.destroy(imageId);
    await user.remove();
      res.status(200).json({message : "user deleted successfully!"});
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: 'internal Server error' });
    }
  }
);

module.exports = router;
