const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "";
// ----------------------end of imports---------------------

app.set('view engine', 'ejs');
app.use(express.static(path.resolve(__dirname, './static')));
app.use(bodyParser.urlencoded({extended: false}));

app.use(session({
  secret: 'cbghsdvbcjksdncbgvd',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 10000000 }
}))

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

// ------------------------pages---------------------------

app.get('/', (req, res) => {
  res.render('home')
})

// -------------------------admin---------------------------

app.get('/admin', (req, res) => {
  if (req.session.user){
    res.redirect('/dash');
  }else{
    res.render('login');
  }
})

app.post('/admin', (req, res) => {
  if (req.body.user == "admin" && req.body.pass == "admin"){
    req.session.user = "admin";
    res.redirect('/admin');
  }else{
    res.redirect('/admin');
  }
})

app.get('/dash', (req, res) => {
  if (req.session.user){
    res.render('dashboard');
  }else{
    res.redirect('/admin');
  }
})

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/')
})

// --------------------------end of calls------------------------

app.listen(3000);
