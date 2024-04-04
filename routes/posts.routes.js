const { Router } = require("express");
const { Post } = require("../db");

const router = Router();

router.get("/", async (_, res) => {
  const posts = await Post.find().populate("likedByCount");

  res.json({ result: true, posts });
});

router.get("/:postId", async (req, res) => {
  const { postId } = req.params;
  const post = await Post.findOne({ _id: postId }).populate("likedBy");

  res.json({ result: true, post });
});

module.exports = router;
