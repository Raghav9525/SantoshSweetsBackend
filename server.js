
const express = require("express");
const app = express();
const mysql = require('mysql2');
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const cors = require('cors');
const cookieParser = require("cookie-parser");
app.use(cookieParser());
app.use(bodyParser.json());
require('dotenv').config();
const secretKey = "54321";

// to allow all urls
const corsOptions = {
    origin: "*", // Allow requests from any origin
    credentials: true, // Enable credentials (cookies) in CORS
};
app.use(cors(corsOptions));


const pool = mysql.createPool({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

//order 
app.post("/order/:food_id", (req, res) => {
    const food_id = req.params.food_id;
    const { foodname, mobile, password, quantity, price } = req.body;
    const selectSql = "SELECT cust_id FROM santosh_user WHERE mobile = ? and password= ?";

    // First, retrieve the name and address from the hotel_user table
    const insertSql = "INSERT INTO santosh_order (food_id, foodname, quantity, price, cust_id) VALUES (?, ?, ?, ?, ?)";


    // get connection Object
    pool.getConnection((err, connection) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Database error' });
        }

        // Retrieve the name and address
        connection.query(selectSql, [mobile,password], (err, result) => {
            if (err) {
                console.log(err);
                connection.release(); // Release the connection when done
                return res.status(500).json({ error: 'Database error' });
            }

            if (result.length > 0) {
                const { cust_id} = result[0]; 
                console.log(cust_id)
                // Insert the data into the rooms table
                connection.query(insertSql, [food_id, foodname, quantity, price, cust_id], (err, data) => {
                    connection.release(); // Release the connection when done

                    if (err) {
                        console.log(err);
                        return res.status(500).json({ error: 'Database error' });
                    }

                    return res.json(data);
                });
            } else {
                connection.release(); // Release the connection when there's no matching mobile
                return res.status(404).json({ error: 'wrong mobile or password' });
            }
        });
    });
})

//signup page
app.post("/signup", (req, res) => {
    console.log("Signup route")
    const values = [
        req.body.nam,
        req.body.mobile,
        req.body.address,
        req.body.password,
    ]

    const sql = "insert into santosh_user(`name`,`mobile`,`address`,`password`) values(?,?,?,?)";

    pool.getConnection((err, connection) => {
        // execute query using connection object
        connection.query(sql, values, (err, result) => {
            if (err) {
                console.log(err)
            }
            connection.release(); // Release the connection when done
            return res.status(200).json({ message: 'Record inserted successfully' });

        });
    });
})



app.get("/", (req, res) => {
    console.log("home page");
})

app.post("/login", (req, res) => {
    // Assuming you receive the username and password in the request body
    const { username, password } = req.body;

    // Perform user authentication here (replace with your actual authentication logic)
    if (username == "shu" && password == "pass") {
        console.log("credential  matched")
        // Create a user object to be included in the token
        const user = {
            id: 1,
            username: "shu",
            email: "shu@gmail.com"
        };

        // Generate a JWT token
        jwt.sign({ user }, secretKey, { expiresIn: '300s' }, (err, token) => {
            if (err) {
                res.status(500).json({ error: 'Failed to generate token' });
            } else {
                // Set the token as a cookie
                console.log({ token })
                // res.cookie('jwtToken', token, { httpOnly: true });
                res.json({ token });
            }
        });

    } else {
        // Authentication failed
        console.log("credential not match")
        res.status(401).json({ error: 'Authentication failed' });
    }
});

// Define the verifyToken middleware
function verifyToken(req, res, next) {
    console.log("hii")

    // Get the token from cookies
    const token = req.cookies.jwtToken;

    if (token) {
        console.log(token)

        jwt.verify(token, secretKey, (err, decoded) => {
            if (err) {
                console.log(err)
                res.status(401).json({ message: 'Unauthorized' });
            } else {
                // Token is valid, continue to the next middleware
                console.log("token varified")
                next();
            }
        });
    } else {
        // Token not provided, redirect to login page
        res.status(401).json({ message: 'Token not provided' })
    }
}

// Add the verifyToken middleware to the /admin route
app.get("/authentication", verifyToken, (req, res) => {
    // If the code reaches here, it means the token is valid
    // You can implement admin-specific logic here
    res.status(200).json({ message: 'Authentication successful' });
});


app.listen(5000, () => {
    console.log("Server running on port 5000");
});
