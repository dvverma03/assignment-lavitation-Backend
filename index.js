const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const CookieParser = require("cookie-parser");
const { DATABASE_NAME } = require("./src/constants.js");
require("dotenv").config();
const User = require("./src/models/user.model.js");
const Product = require("./src/models/product.model.js");

const app = express();
app.use(express.json());
// const corsOptions = {
//   origin: "http://localhost:3000",
//   credentials: true, //access-control-allow-credentials:true
//   optionSuccessStatus: 200,
// };

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000/');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// app.use(cors(corsOptions));

app.use(CookieParser());

mongoose
  .connect(process.env.DATABASE_URL, {
    autoIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(`MongoDB connected !! DB HOST: ${mongoose.connection.host}`);
  })
  .catch((err) => {
    console.error("MONGODB connection FAILED ", err);
    process.exit(1);
  });

app.post("/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.json("user already exists");
    }

    const hash = await bcrypt.hash(password, 10);
    const createdUser = await User.create({ fullName, email, password: hash });

    const token = jwt.sign({ userId: createdUser._id }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    });

    const updatedUser = await User.findByIdAndUpdate(
      createdUser._id, // Use createdUser._id instead of user._id
      { token: token },
      { new: true }
    );
    res.cookie("token", token);
    res.json({ status: "ok", user: updatedUser._id, token: token });
  } catch (err) {
    res.status(500).json(err);
  }
});


app.post("/add-invoice", async (req, res) => {
  console.log(req.body);
  const loginId = req?.body?.userId;
  const { product, rate, total, quantity } = req.body;
  const pro = { product, rate, total, quantity };
  console.log(loginId);

  try {
    const user = await User.findByIdAndUpdate(
      loginId,
      { $push: { products: pro } },
      { new: true }
    );

    console.log("User:", user);
    res.json({ status: "ok", message: "Product added to user's products" });
  } catch (err) {
    console.error("Error adding product to user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  User.findOne({ email: email }).then((user) => {
    if (user) {
      bcrypt.compare(password, user.password, (err, response) => {
        if (response) {
          const Token = jwt.sign(
            {
              _id: user._id,
              email: user.email,
              username: user.username,
              fullName: user.fullName,
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
              expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
            }
          );
          User.findByIdAndUpdate(user._id, { token: Token }, { new: true })
            .then((updatedUser) => {
              res.cookie("token", Token, { httpOnly: true,
              secure: true, 
              sameSite: 'None',
              domain:'https://assignment-lavitation-backend.vercel.app/',
              path:'/' });

              return res.json(updatedUser);
            })
            .catch((err) => {
              console.error("Error updating token:", err);
              return res.status(500).json({ error: "Internal server error" });
            });
        } else {
          return res.json("Password is incorrect");
        }
      });
    } else {
      return res.json("No record found");
    }
  });
});

app.post("/logout", (req, res) => {
  const { token1 } = req.body;
  User.findOne({ token: token1 }).then((user) => {
    if (user) {
      const token2 = Math.random() + new Date()
      User.findByIdAndUpdate(
        user._id,
        { token: token2 },
        { new: true }
      ).then((updatedUser) => {
        return res.json(updatedUser);
      }).catch((err) => {
        console.error("Error updating token:", err);
        return res.status(500).json({ error: "Internal server error" });
      });
    } else {
      return res.json("Password is incorrect");
    }
  });
});

// app.post("/login", (req, res) => {
//   const { email, password } = req.body;
//   User.findOne({ email: email }).then((user) => {
//     if (user) {
//       console.log(user);
//       bcrypt.compare(password, user.password, (err, response) => {
//         if (response) {
//           const Token = jwt.sign(
//             {
//               _id: user._id,
//               email: user.email,
//               username: user.username,
//               fullName: user.fullName,
//             },
//             process.env.ACCESS_TOKEN_SECRET,
//             {
//               expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
//             }
//           );
//           res.cookie("token", Token);
//           console.log(user);
//           console.log(user.products);
//           return res.json(user);
//         } else {
//           return res.json("Password is incorrect");
//         }
//       });
//     } else {
//       return res.json("No record find");
//     }
//   });
// });

app.post("/browse", (req, res) => {
  const { token1 } = req.body;
  User.findOne({ token: token1 }).then((user) => {
    console.log(user)
    if (user) {
      return res.json(user);
    } else {
      return res.json("Password is incorrect");
    }
  });
});

app.listen(1234, () => {
  console.log(`server is running at port${1234}`);
});
