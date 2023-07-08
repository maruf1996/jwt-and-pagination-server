const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
require('dotenv').config()
const port =process.env.PORT
const jwt = require('jsonwebtoken');
const auth = require("./middleware/auth");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());


/**
 * API
 * route
 *  /users (paginated)
 *  /user/create
 *  /login
 *  /register
 *  /users (protected)
 */

const uri = "mongodb://0.0.0.0:27017/"
const client = new MongoClient(uri);

async function dbConnect() {
  try {
    await client.connect();
    console.log("Database connected");
  } catch (error) {
    console.log(error.message);
  }
}
dbConnect();

const db=client.db('test');
const usersCollection=db.collection('users');

//Routes
app.get('/', (req, res) => {
  res.json({
    message:'Its start'
  })
})

app.get('/users',auth,async(req,res)=>{
  const users=await usersCollection.find().toArray();
  res.send({
    status:'success',
    data:users
  })
})

app.get('/p-users',async(req,res)=>{
    // [1, 2, 3, 4, 5, 6] => 1 - 3, 4 - 6

    const limit = Number(req.query.limit) || 10;

    // 2 -1 = 1 * 10 => 10
    // 3 -1 = 2 * 10 => 20
    const page = Number(req.query.page) - 1 || 0;

    console.log(req.query);
    // limit
    // 1 - 10, 11 - 20

    const users=await usersCollection.find({}).limit(limit).skip(limit*page).toArray();
    res.send({
      status:'success',
      data:users
    })
})

app.post('/user/create',async(req,res)=>{
  const user=await usersCollection.insertOne({
    name: "John Doe",
    email: "tamim@gmail.com",
    password: "123456",
  })
  res.send({
    status: "success",
    data: user,
  });
})

 // registration
 app.post('/register',async(req,res)=>{
  const {name,email,password}=req.body;

  if(!name||!email||!password){
    return res.send({
      status: "error",
      message: 'Please provide all the values',
    });
  }

  const user=await usersCollection.insertOne({
    name,
    email,
    password
  })
  res.send({
    status: "success",
    data: user,
  });
})

// login
app.post('/login',async(req,res)=>{
   /**
       * 1. validate body
       * 2. find the user
       * 3. if user not found, send invalid error response
       * 4. user found
       * 5. create token
       * 6. send response
       */

  const {email,password}=req.body;
  if(!email||!password){
    return res.send({
      status: "error",
      message: 'Please provide all the values',
    });
  }
  
  const user=await usersCollection.findOne({email});
  if (!user) {
    return res.send({
      status: "error",
      message: "User does not exist",
    });
  }

  const isPasswordCorrectUser = await usersCollection.findOne({
    email: email,
    password: password,
  });
  // This part will be skipped if user is found.
  if (!isPasswordCorrectUser) {
    return res.send({
      status: "error",
      message: "Invalid credentials",
    });
  }

  const tokenObj={
    email:isPasswordCorrectUser.email,
    id:isPasswordCorrectUser._id
  }
  const token=jwt.sign(tokenObj,process.env.JWT_SECRET)

  res.send({
    status: "success",
    data: tokenObj,
    token:token
  });
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})