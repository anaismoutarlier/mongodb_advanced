const mongoose = require("mongoose");
const fs = require("fs").promises;

const User = mongoose.model(
  "users",
  mongoose.Schema(
    {
      username: String,
      email: String,
      password: String,
      type: String,
      gender: String,
      status: String,
      birthdate: Date,
      likedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "posts" }],
    },
    { timestamps: true }
  )
);

const Post = mongoose.model(
  "posts",
  mongoose.Schema(
    {
      title: String,
      content: String,
      user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
      comments: [
        mongoose.Schema(
          {
            content: String,
            user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
          },
          {
            timestamps: true,
          }
        ),
      ],
    },
    {
      timestamps: true,
    }
  )
);

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const populateDb = async () => {
  const { users, posts } = require("../data");
  const dir = await fs.readdir(".");
  if (!dir.includes("data")) {
    console.log("Data folder missing.");
    return;
  }
  if (!dir.includes("package.json")) {
    console.log("Please run this script from the project root folder.");
    return;
  }
  if (!dir.includes(".env")) {
    await fs.writeFile(".env", 'MONGODB_URI=""');
    console.log(
      "Please include DB environment variables before setup. A .env file with the correct properties has been created for you."
    );
    return;
  }
  require("dotenv").config();
  await mongoose.connect(process.env.MONGODB_URI);
  await User.deleteMany();
  await Post.deleteMany();
  console.log("Database connected.");
  const createdUsers = await User.create(
    users.map(user => {
      user.createdAt = user.dateCreated;

      return user;
    }),
    { timestamps: false }
  );
  await User.updateMany({});
  console.log("User docs created.");
  const userIds = createdUsers.map(({ _id }) => _id);
  let postsCreated = await Post.create(
    posts.map(post => {
      const i = Math.floor(Math.random() * (userIds.length + 1));
      post.user = userIds[i];
      post.comments = post.comments.map(comment => {
        let j = Math.floor(Math.random() * (userIds.length + 1));
        if (j === i) j === userIds.length - 1 ? j-- : j++;
        comment.user = userIds[j];
        return comment;
      });
      return post;
    })
  );
  console.log("Post and comment docs created.");
  for (const post of postsCreated) {
    const usersLiked = await User.aggregate([
      {
        $sample: {
          size: getRandomNumber(0, 3),
        },
      },
      {
        $project: {
          _id: 1,
        },
      },
    ]);
    await User.updateMany(
      { _id: { $in: usersLiked.map(({ _id }) => _id) } },
      { $push: { likedPosts: post._id } }
    );
  }
  console.log("Likes generated.");
  await mongoose.disconnect();
  console.log("Database disconnected.");
};

populateDb();
