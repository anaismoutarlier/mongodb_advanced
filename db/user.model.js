const mongoose = require("mongoose");
const moment = require("moment");

const UserSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      select: false,
      index: true,
      validate: {
        validator: val => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(val),
        message: ({ value }) => `${value} is not a valid email address.`,
      },
    },
    password: {
      type: String,
      select: false,
      // this = document
      required: () => this.status !== "pending",
    },
    type: {
      type: String,
      enum: ["admin", "moderator", "user"],
      default: "user",
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "non-binary"],
    },
    status: {
      type: String,
      enum: ["pending", "active", "inactive"],
      default: "pending",
    },
    birthdate: Date,
    likedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "posts" }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

UserSchema.virtual("age").get(function () {
  // this = document
  if (!this.birthdate) return null;

  return moment().diff(this.birthdate, "years");
});

UserSchema.post("deleteOne", async function () {
  // this = request / query
  const user = this.getFilter()._id;
  await mongoose.model("posts").deleteMany({ user });
  await mongoose
    .model("posts")
    .updateMany({ "comments.user": user }, { $pull: { comments: { user } } });
});

UserSchema.loadClass(
  class {
    static findOneWithAuth(filter = {}) {
      // this = model
      return this.findOne(filter).select("+email +password");
    }

    static findActive(filter = {}) {
      return this.find({ ...filter, status: "active" });
    }

    static findByInscriptionMonth() {
      const query = [
        {
          $addFields: {
            year: {
              $year: "$createdAt",
            },
            month: {
              $month: "$createdAt",
            },
          },
        },
        {
          $group: {
            _id: {
              year: "$year",
              month: "$month",
            },
            users: {
              $push: {
                _id: "$_id",
                username: "$username",
              },
            },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
        {
          $project: {
            year: "$_id.year",
            month: "$_id.month",
            users: 1,
            _id: 0,
            nbUsers: {
              $size: "$users",
            },
          },
        },
      ];

      return this.aggregate(query);
    }
  }
);

module.exports = mongoose.model("users", UserSchema);
