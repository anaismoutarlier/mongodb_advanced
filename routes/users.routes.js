const { Router } = require("express");
const { User } = require("../db");

const router = Router();

router.get("/", async (_, res) => {
  const users = await User.findActive();

  res.json({ result: true, nbUsers: users.length, users });
});

router.delete("/:userId", async (req, res) => {
  const { userId } = req.params;

  const data = await User.deleteOne({ _id: userId });

  res.json({ result: true, ...data });
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOneWithAuth({ email });

  res.json({ result: Boolean(user) && user.password === password });
});

module.exports = router;
