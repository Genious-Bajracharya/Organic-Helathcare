const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const session = require("express-session");
const speakeasy = require("speakeasy");
const secret = speakeasy.generateSecret({ length: 4 });
const crypto = require("crypto");
const multer = require("multer");
// const { localStorage } = require("node-localstorage");

const app = express();
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());

// res.header("Access-Control-Allow-Origin", "http://localhost:3000");
// res.header("Access-Control-Allow-Credentials", true);
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "mAsenko88",
  database: "Organic",
});

// email
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "bajracharyagenious@gmail.com",
    pass: "hpjzmzpbgsuasirl",
  },
});

//otp ting

//try2
const { Vonage } = require("@vonage/server-sdk");

const vonage = new Vonage({
  apiKey: "82896004",
  apiSecret: "1Rr2KCZAMjH9zI1M",
});

// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "http://localhost:3000");
//   res.header("Access-Control-Allow-Credentials", true);
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   next();
// });

app.post("/register", (req, res) => {
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;
  const phone = req.body.phone;
  const token = crypto.randomBytes(20).toString("hex");
  // const token = speakeasy.totp({
  //   secret: secret.base32,
  //   encoding: "base32",
  // });

  con.query(
    "INSERT INTO users (email, username, password, phone, token) VALUES (?, ?, ?, ?, ?)",
    [email, username, password, phone, token],
    (err, result) => {
      if (result) {
        const mailOptions = {
          from: '"Organic Healtcare" <bajracharyagenious@gmail.com>',
          to: req.body.email,
          subject: "Verification Link",
          text:
            "Click the link to verify your email: http://localhost:3001/verify?token=" +
            token,
        };
        transporter.sendMail(mailOptions, (error, result) => {
          if (error) {
            // show an error message
            res.send({ message: "Mail Error!" });
          } else {
            res.send(result);
          }
        });
        res.send(result);
      } else {
        res.send({ message: "Error Invalid email" });
      }
    }
  );
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  console.log(username);
  const password = req.body.password;
  const token = speakeasy.totp({
    secret: secret.base32,
    encoding: "base32",
  });
  con.query(
    "SELECT * FROM users WHERE password = ? AND verified = 1 AND username = ?",
    [password, username, username],
    (err, result) => {
      if (err) {
        req.setEncoding({ err: err });
      } else {
        if (result.length > 0) {
          if (result[0].role === "admin") {
            req.session.role = "admin";
            res.send({ role: result[0].role });
          } else {
            req.session.username = username;
            con.query(
              "UPDATE users SET otp = ? WHERE username = ?",
              [token, username],
              (err, result) => {
                if (err) {
                  res.status(500).send({ message: " Error!" });
                } else {
                  con.query(
                    "SELECT phone FROM users WHERE username = ?",
                    [username],
                    (err, result) => {
                      if (err) {
                        res.status(500).send({ message: " Error!" });
                      } else if (result.length > 0) {
                        const phoneNumber = result[0].phone;
                        const from = "Organic Healthcare";
                        const to = `977${phoneNumber}`;
                        const text = `Your OTP is: ${token}`;

                        async function sendSMS() {
                          await vonage.sms
                            .send({ to, from, text })
                            .then((resp) => {
                              console.log("Message sent successfully");
                              console.log(resp);
                            })
                            .catch((err) => {
                              console.log(
                                "There was an error sending the messages."
                              );
                              console.error(err);
                            });
                        }

                        // sendSMS();  Uncomment later*************************************************************************************
                        res.send(result);
                      }
                    }
                  );
                }
              }
            );
          }
          // res.send(result);
        } else {
          res.send({
            message: "INCORRECT USERNAME/PASSWORD or email unverified",
          });
        }
      }
    }
  );
});

app.post("/logout", (req, res) => {
  req.session.destroy();
  res.status(200).send({ message: "Logout successful" });
});

//profile
app.get("/profile/:username", (req, res) => {
  const username = req.params.username;
  const query = "SELECT * FROM users WHERE username = ?";
  con.query(query, [username], (err, result) => {
    if (err) throw err;
    res.json(result[0]);
  });
});

app.post("/editprofile", (req, res) => {
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;
  const phone = req.body.phone;
  const username1 = req.body.username1;
  const query =
    "UPDATE users SET username = ?, email = ?, password = ?, phone = ? WHERE username = ?";
  con.query(
    query,
    [username, email, password, phone, username1],
    (err, result) => {
      if (err) throw err;
      res.json({ message: "User updated successfully" });
    }
  );
});

app.post("/forgot", (req, res) => {
  const email = req.body.email;
  const code = speakeasy.totp({
    secret: secret.base32,
    encoding: "base32",
  });
  con.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
    if (err) {
      res.status(500).send({ message: "Mail Error!" });
    } else {
      if (result.length > 0) {
        con.query(
          "UPDATE users SET otp = ? WHERE email = ?",
          [code, email],
          (err, result) => {
            if (err) {
              res.status(500).send({ message: "Mail Error!" });
            } else {
              const mailOptions = {
                from: '"Organic Healtcare" <bajracharyagenious@gmail.com>',
                to: req.body.email,
                subject: "Reset your Password",
                text: "Your code is " + code,
              };
              transporter.sendMail(mailOptions, (error, result) => {
                if (error) {
                  // show an error message
                  res.send({ message: "Mail Error!" });
                } else {
                  res.send(result);
                }
              });
              // res.send(result);
            }
          }
        );

        // res.send(result);
      } else {
        res.send({ message: "Incorrect Email address!" });
      }
    }
  });
});

app.post("/reset", (req, res) => {
  const code = req.body.code;
  const password = req.body.password;
  const confPassword = req.body.confPassword;

  if (password === confPassword) {
    const insertString = "UPDATE users SET password = ? WHERE otp = ?";
    con.query(insertString, [password, code], (error, result) => {
      if (error) {
        console.error(error);
        res.sendStatus(500);
        return;
      } else {
        res.send(result);
      }
    });
  } else {
    res.send({ message: "Code or Passwords dont match" });
  }
});

app.post("/otp", (req, res) => {
  const otp = req.body.otp;
  const queryString = "SELECT * FROM users WHERE otp = ? ";
  con.query(queryString, [otp], (error, results) => {
    if (error) {
      console.error(error);
      res.send({ message: "Incorrect OTP" });
    } else if (results.length > 0) {
      req.session.loggedIn = true;
      res.send(results);
    } else {
      res.send({ message: "Incorrect OTP" });
    }
  });
});

app.get("/verify", (req, res) => {
  const token = req.query.token;
  // console.log(token);
  // check the token in the database
  con.query(
    "SELECT * FROM users WHERE token = ?",
    [token],
    (error, results) => {
      if (error) {
        // show an error message
        return res.send(error.message);
      }
      if (results.length > 0) {
        // update the user's status in the database
        con.query(
          "UPDATE users SET verified = 1 WHERE token = ?",
          // "UPDATE users SET (username, password, email, phone, verified) VALUES (?, ?, ?, ?, ?) Where token= ?",
          [token],
          (error) => {
            if (error) {
              // show an error message
              return res.send(error.message);
            }
            // show a success message
            res.send("Your email address has been verified.");
            // res.redirect("http://localhost:3000/login");
          }
        );
      } else {
        // show an error message
        res.send("Invalid token.");
      }
    }
  );
});

app.get("/userorders", (req, res) => {
  const { username } = req.query;
  const query =
    "SELECT DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at, status, product, username FROM orders WHERE username = ? GROUP BY created_at ORDER BY status DESC,created_at DESC;";
  con.query(query, [username], (error, results) => {
    if (error) {
      console.error("Error fetching users: ", error.message);
      res.sendStatus(500);
    } else {
      console.log(username);
      res.json(results);
    }
  });
});

//Product/////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get("/products", (req, res) => {
  const query = "SELECT * FROM products";
  con.query(query, (error, results) => {
    if (error) {
      console.error("Error fetching products: ", error.message);
      res.sendStatus(500);
    } else {
      results = results.map((product) => {
        return {
          ...product,
          pic: product.pic
            ? Buffer.from(product.pic, "binary").toString("base64")
            : null,
        };
      });

      res.json(results);
    }
  });
});

app.get("/productsherb", (req, res) => {
  const query = "SELECT * FROM products where type= ?";
  con.query(query, ["herb"], (error, results) => {
    if (error) {
      console.error("Error fetching products: ", error.message);
      res.sendStatus(500);
    } else {
      results = results.map((product) => {
        return {
          ...product,
          pic: product.pic
            ? Buffer.from(product.pic, "binary").toString("base64")
            : null,
        };
      });
      res.json(results);
    }
  });
});

app.get("/productsfruit", (req, res) => {
  const query = "SELECT * FROM products where type= ?";
  con.query(query, ["fruits"], (error, results) => {
    if (error) {
      console.error("Error fetching products: ", error.message);
      res.sendStatus(500);
    } else {
      results = results.map((product) => {
        return {
          ...product,
          pic: product.pic
            ? Buffer.from(product.pic, "binary").toString("base64")
            : null,
        };
      });
      res.json(results);
    }
  });
});

app.get("/productsveg", (req, res) => {
  const query = "SELECT * FROM products where type= ?";
  con.query(query, ["vegetable"], (error, results) => {
    if (error) {
      console.error("Error fetching products: ", error.message);
      res.sendStatus(500);
    } else {
      results = results.map((product) => {
        return {
          ...product,
          pic: product.pic
            ? Buffer.from(product.pic, "binary").toString("base64")
            : null,
        };
      });
      res.json(results);
    }
  });
});

app.get("/products/:id", (req, res) => {
  const productId = req.params.id;

  con.query(
    `SELECT * FROM products WHERE id = ${productId}`,
    (error, results) => {
      if (error) {
        return res.status(500).send(error);
      }

      const product = results[0];

      if (!product) {
        return res.status(404).send("Product not found");
      }

      if (product.pic) {
        product.pic = Buffer.from(product.pic, "binary").toString("base64");
      }

      res.send(product);
    }
  );
});

//cart
app.post("/cart", (req, res) => {
  //   const productId = req.body.productId;

  //   const username = localStorage.getItem("username");
  //   const query = `INSERT INTO cart (username, product_id) VALUES (${username}, ${productId})`;
  //   con.query(query, (err, result) => {
  //     if (err) throw err;
  //     res.json({ message: "Product added to cart" });
  //   });
  // });
  const { product, username, quantity } = req.body;
  const query = "SELECT * FROM cart WHERE product_id=? and username= ?;";
  con.query(query, [product.id, username], (error, results) => {
    if (error) {
      // req.setEncoding({ err: error });
      console.log(error);
    } else if (results.length > 0) {
      const query =
        "UPDATE cart SET quantity = ? WHERE product_id = ? AND username=?";
      con.query(query, [quantity, product.id, username], (err, result) => {
        if (err) throw err;
        res.json({ message: "Added successfully" });
      });
      // res.json(results);
    } else {
      const query1 = `INSERT INTO cart (username, product_id, quantity) VALUES (${con.escape(
        username
      )}, ${con.escape(product.id)},${con.escape(quantity)})`;
      con.query(query1, (err, result) => {
        if (err) {
          res.send("product already added");
        }
        res.json({ message: "Product added to cart" });
      });
    }
  });
});

// Get cart items
app.get("/cart/:username", (req, res) => {
  const username = req.params.username;
  const query =
    "SELECT   products.Name,products.id, products.price, products.pic,cart.quantity FROM products INNER JOIN cart ON products.id = cart.product_id WHERE cart.username = ?";
  con.query(query, [username], (err, result) => {
    if (err) throw err;
    result = result.map((product) => {
      if (product.pic) {
        product.pic = Buffer.from(product.pic, "binary").toString("base64");
      }

      return product;
    });

    res.json(result);
  });
});

app.post("/send-email", async (req, res) => {
  const { from, to, subject, html } = req.body;
  try {
    // Send email using nodemailer
    const mailOptions = {
      from: from,
      to: to,
      subject: subject,
      html: html,
    };
    await transporter.sendMail(mailOptions);
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.post("/removecart", (req, res) => {
  // const { name, price, image } = req.body;
  const productname = req.body.productId;
  const username = req.body.username;
  // Save the purchase to the database
  const query = "Select id from products where name=?";
  con.query(query, [productname], (err, result) => {
    if (err) throw err;
    console.log(result[0]);
    const productID = result[0].id;
    const query1 = "Delete from cart where username = ? and product_id =  ?";
    con.query(query1, [username, productID], (err, result) => {
      if (err) throw err;
    });
    res.json({ message: "Removed successfully" });
  });
});

app.post("/buy", (req, res) => {
  const { name, price, image } = req.body;
  // Save the purchase to the database
  const query = "INSERT INTO purchases (name, price, image) VALUES (?, ?, ?)";
  con.query(query, [name, price, image], (err, result) => {
    if (err) throw err;
    res.json({ message: "Purchase successful" });
  });
});

app.post("/order", async (req, res) => {
  const { items } = req.body;
  const { username } = req.body;
  const { price } = req.body;
  console.log(username);

  try {
    for (const item of items) {
      con.query(
        "INSERT INTO orders (product, quantity, username, total_price) VALUES (?, ?, ?, ?)",
        [item.id, item.quantity, username, item.price]
      );
      con.query("UPDATE products SET stock=stock-? WHERE Name = ?", [
        item.quantity,
        item.id,
      ]);
      // console.log(username);
    }
    con.query("DELETE FROM cart where username= ?", [username]);
    res.status(200).send("Order placed successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Something went wrong");
  }
});

//admin

app.get("/showusers", (req, res) => {
  const query = "select count(username) from users";
  con.query(query, ["admin"], (error, results) => {
    if (error) {
      console.error("Error fetching users: ", error.message);
      res.sendStatus(500);
    } else {
      res.json(results);
      console.log(results);
    }
  });
});

app.get("/showstock", (req, res) => {
  const query = "select count(Name) from products where stock=0";
  con.query(query, ["admin"], (error, results) => {
    if (error) {
      console.error("Error fetching users: ", error.message);
      res.sendStatus(500);
    } else {
      res.json(results);
    }
  });
});

app.get("/money", (req, res) => {
  const query =
    "SELECT SUM(total) AS count_total FROM (SELECT total_price * quantity AS total FROM orders) AS temp_table;";
  con.query(query, ["admin"], (error, results) => {
    if (error) {
      console.error("Error fetching users: ", error.message);
      res.sendStatus(500);
    } else {
      console.log(results);
      res.json(results);
    }
  });
});

app.get("/showorder", (req, res) => {
  const query = "select count(DISTINCT created_at) from orders";
  con.query(query, ["admin"], (error, results) => {
    if (error) {
      console.error("Error fetching users: ", error.message);
      res.sendStatus(500);
    } else {
      res.json(results);
    }
  });
});

app.get("/users", (req, res) => {
  const query = "SELECT * FROM users where role!=? ";
  con.query(query, ["admin"], (error, results) => {
    if (error) {
      console.error("Error fetching users: ", error.message);
      res.sendStatus(500);
    } else {
      res.json(results);
    }
  });
});

app.get("/recentsales", (req, res) => {
  const query =
    "select * from orders group by created_at order by created_at desc ;	 ";
  con.query(query, ["admin"], (error, results) => {
    if (error) {
      console.error("Error fetching users: ", error.message);
      res.sendStatus(500);
    } else {
      res.json(results);
    }
  });
});

app.get("/orders", (req, res) => {
  const query =
    "SELECT DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at, status, product, username FROM orders GROUP BY created_at ORDER BY status DESC,created_at DESC;";
  con.query(query, ["admin"], (error, results) => {
    if (error) {
      console.error("Error fetching users: ", error.message);
      res.sendStatus(500);
    } else {
      res.json(results);
    }
  });
});

app.post("/status", (req, res) => {
  const productId = req.body.productId;
  const query = "UPDATE orders SET status = ? WHERE created_at = ?";
  con.query(query, ["Delivered", productId], (err, result) => {
    if (err) throw err;
    res.json({ message: "Stock updated successfully" });
  });
});

app.get("/orderdetail/:id", (req, res) => {
  const date = req.params.id;
  const { username } = req.body;
  console.log(date);
  const query = "SELECT * from orders where created_at = ?";
  con.query(query, [date], (error, results) => {
    if (error) {
      console.error("Error fetching users: ", error.message);
      res.sendStatus(500);
    } else {
      res.json(results);
    }
  });
});

app.get("/stock", (req, res) => {
  const query = "SELECT * FROM products ORDER BY stock ASC";
  con.query(query, ["admin"], (error, results) => {
    if (error) {
      console.error("Error fetching users: ", error.message);
      res.sendStatus(500);
    } else {
      res.json(results);
    }
  });
});

app.post("/updateproducts", (req, res) => {
  const name = req.body.name;
  const description = req.body.description;
  const price = req.body.price;
  const productId = req.body.productId;
  const query =
    "UPDATE products SET Name = ?, description = ?, price = ? WHERE id = ?";
  con.query(query, [name, description, price, productId], (err, result) => {
    if (err) throw err;

    res.json({ message: "Product updated successfully" });
  });
});

app.post("/removeproducts", (req, res) => {
  const productId = req.body.productId;
  const query = "DELETE FROM products WHERE id = ?";
  con.query(query, [productId], (err, result) => {
    if (err) throw err;

    res.json({ message: "Product removed successfully" });
  });
});

app.get("/updateproducts/:id", (req, res) => {
  const productId = req.params.id;

  con.query(
    `SELECT * FROM products WHERE id = ${productId}`,
    (error, results) => {
      if (error) {
        return res.status(500).send(error);
      }

      const product = results[0];

      if (!product) {
        return res.status(404).send("Product not found");
      }

      if (product.pic) {
        product.pic = Buffer.from(product.pic, "binary").toString("base64");
      }

      res.send(product);
    }
  );
});

app.get("/addstock/:id", (req, res) => {
  const productId = req.params.id;

  con.query(
    `SELECT * FROM products WHERE id = ${productId}`,
    (error, results) => {
      if (error) {
        return res.status(500).send(error);
      }

      const product = results[0];

      if (!product) {
        return res.status(404).send("Product not found");
      }
      if (product.pic) {
        product.pic = Buffer.from(product.pic, "binary").toString("base64");
      }

      res.send(product);
    }
  );
});

app.post("/addstock", (req, res) => {
  const addstock = req.body.addstock;

  const productId = req.body.productId;
  const query = "UPDATE products SET stock = stock + ? WHERE id = ?";
  con.query(query, [addstock, productId], (err, result) => {
    if (err) throw err;
    res.json({ message: "Stock updated successfully" });
  });
});

app.post("/addhealthproblem", (req, res) => {
  const { name, solution1, solution2, solution3, solution4, solution5 } =
    req.body;

  const query =
    "INSERT into HEALTH_PROBLEM(name, solution1, solution2, solution3, solution4, solution5) VALUES(?, ?, ?, ?, ?, ?)";
  con.query(
    query,
    [name, solution1, solution2, solution3, solution4, solution5],
    (err, result) => {
      if (err) throw err;
      res.json({ message: "Added successfully" });
    }
  );
});

app.post("/registeradmin", (req, res) => {
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;
  const phone = req.body.phone;
  const token = crypto.randomBytes(20).toString("hex");

  con.query(
    "INSERT INTO users (email, username, password, phone, token, role) VALUES (?, ?, ?, ?, ?, ?)",
    [email, username, password, phone, token, "admin"],
    (err, result) => {
      if (result) {
        res.send(result);
      } else {
        res.send({ message: "Error" });
      }
    }
  );
});

//storage for images
// const path = require("path");
// const fileUpload = require("express-fileupload");
// const fs = require("fs");
// app.use(express.static("public"));
// app.use(fileUpload());

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "./images");
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname);
//   },
// });

// const upload = multer({ storage: storage });
// app.use("/images", express.static(path.join(__dirname, "images")));

//add product
// app.post("/addproduct", upload.single("image"), async (req, res) => {
//   const name = req.body.name;
//   const type = req.body.type;
//   const price = req.body.price;
//   const description = req.body.description;
// const imagename = req.body.imagename;
// const image = req.file;

// const imagePath = path.join(__dirname, "../client/public/images", imagename);

// let imageUrl;

// const file = req.files.file;
// const filePath = path.join(__dirname, "public", "images", file.name);

// Check if there's an error in the file upload
// fs.readFile(image.path, (err, data) => {
//   if (err) {
//     console.log(err);
//     return res.status(500).send("Server Error");
//   }
//   fs.writeFile(imagePath, data, (err) => {
//     if (err) {
//       console.log(err);
//       return res.status(500).send("Server Error");
//     }

//     // Send the response to the client with the image URL
//     const imageUrl = `/public/images/${imagename}`;
//     return res.status(200).send(imageUrl);
//   });
// });

// file.mv(filePath, (err) => {
//   if (err) {
//     console.error(err);
//     return res.status(500).send("Failed to upload file");
//   }

//   res.send("File uploaded successfully");
// });

//   con.query(
//     "INSERT INTO products (name, price, description, type) VALUES (?, ?, ?, ?)",
//     [name, price, description, type],
//     (err, result) => {
//       if (result) {
//         res.send(result);
//       } else {
//         res.send({ message: "Error" });
//       }
//     }
//   );
// });

//add product 2
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/addproduct", upload.single("image"), (req, res) => {
  const name = req.body.name;
  const type = req.body.type;
  const price = req.body.price;
  const description = req.body.description;
  const image = req.file.buffer;

  con.query(
    "INSERT INTO products (name, price, description, type, pic) VALUES (?, ?, ?, ?, ?)",
    [name, price, description, type, image],
    (err, result) => {
      if (result) {
        res.send(result);
      } else {
        res.send({ message: "Error" });
      }
    }
  );
});

//search
app.get("/search/:id", (req, res) => {
  const searchTerm = req.params.id;
  const query = `
    SELECT p.*
    FROM products p
    JOIN health_problem h ON
      h.solution1 LIKE CONCAT('%', p.Name, '%')
      OR h.solution2 LIKE CONCAT('%', p.Name, '%')
      OR h.solution3 LIKE CONCAT('%', p.Name, '%')
      OR h.solution4 LIKE CONCAT('%', p.Name, '%')
      OR h.solution5 LIKE CONCAT('%', p.Name, '%')
    WHERE h.name LIKE '${searchTerm}%'
  `;
  con.query(query, [searchTerm], (error, results) => {
    if (error) {
      return res.status(500).send(error);
    }

    results = results.map((product) => {
      if (product.pic) {
        product.pic = Buffer.from(product.pic, "binary").toString("base64");
      }
      return product;
    });

    res.json(results);
  });
});

//search product
app.get("/searchproduct/:id", (req, res) => {
  const searchTerm = req.params.id;
  const query = `
    SELECT * from products where NAME LIKE '${searchTerm}%'
  `;
  con.query(query, [searchTerm], (error, results) => {
    if (error) {
      return res.status(500).send(error);
    }

    results = results.map((product) => {
      if (product.pic) {
        product.pic = Buffer.from(product.pic, "binary").toString("base64");
      }
      return product;
    });

    res.json(results);
  });
});

app.listen(3001, () => {
  console.log("running backend server");
});
