const express = require('express')
const app = express()
const mysql = require('mysql2')
const cors = require('cors')
const bcrypt = require('bcrypt')
const dotenv = require('dotenv');

app.use(express.json())
app.use(cors())
dotenv.config();

//connection to the database
const db = mysql.createConnection({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD
})

//check if connection works
db.connect((err) => {
    if (err) {
        console.log(err)
    } else {
        console.log('Connected to the database as id: ", db.threadId')
    }

    //create a database
    db.query(`CREATE DATABASE IF NOT EXISTS expense_tracker`, (err, result) => {
        if (err) console.log(err)
        
        console.log("Database epense_tracker created");
        

        //change our database
        db.changeUser({databse: 'expense_tracker'}, (err, result) => {
            if (err) console.log(err)
             
            console.log("Database changed to expense_tracker");

            //create users table
            const usersTable = `CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL
            )`;
            db.query(usersTable, (err, result) => {
                if (err) console.log(err)
                console.log("Table users created");
            });
        })
    })
})


//user registration route
app.post('api/register', async (req, res) => {
    try{
        const users = `SELECT * FROM users WHERE email = ?`
        //check if user exists
        db.query(users, [req.body.email], (err, data) => {
            if(data.length > 0)  return res.status(400).json("User already exists");


            //hash password
            const salt = bcrypt.genSaltSync(10)
            const hashedpassword = bcrypt.hashSync(req.body.password, salt)

            const newUser = `INSERT INTO users (username, email, password) VALUES ( ?)`    
            value = [req.body.email, req.body.username, hashedpassword]

            db.query(newUser, [value], (err, data) => {
                if(err) return res.status(500).json("Something is wrong")
                res.status(201).json("User created")
            })
        })    
    }
    catch(err) {
       res.status(500).json("Internal Server Error")
    }
})

//user login route
app.post('/api/login', async(req,res) =>{
    try{
        const users = `SELECT * FROM users WHERE email = ?`
        db.query(users, [req.body.email], (err, data) => {
            if(data.length === 0) return res.status(400).json("User not found")

            const validPassword = bcrypt.compareSync(req.body.password, data[0].password)

            if(!validPassword) return res.status(400).json("Invalid email or password")

            return res.status(200).json("User logged in")    
            })
    }
    catch(err){
        res.status(500).json("Internal Server Error")
    }
})

app.listen(3001, () => {
    console.log('server is running on port 3001...')
})