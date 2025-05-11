const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const fileUpload = require('express-fileupload');
const fs = require('fs');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb://localhost";
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

const mongo = client.db('portfolio');

app.use('/dash', (req, res, next) => {
  if(req.session.user){
    next();
  }else{
    // res.redirect('/admin');
    next();
  }
});


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
    res.redirect('/dash');
  }else{
    res.redirect('/admin');
  }
})

app.get('/dash' ,(req, res) => {
  res.render('dashboard', {type: 'center'});
})

app.get('/dash/files', async (req, res) => {
  await client.connect();
  const files = await mongo.collection('Files').find().toArray();
  await client.close();
  res.render('dashboard', {type: 'fileUpload', files});
})

app.post('/dash/files', fileUpload() ,async (req, res) => {
  let theFile = req.files.theFile;
  let ext = theFile.name.slice(theFile.name.lastIndexOf("."));
  let newName = uuidv4() + ext;
  let uploadPath = __dirname + '/static/files/' + newName;
  const fileDetails = {
    name: req.body.filename,
    date: new Date(),
    path: newName,
    category: req.body.category
  }
  console.log(fileDetails);
  await theFile.mv(uploadPath, function(err) {
      if (err)
        return res.status(500).send(err);
    });

  await client.connect();
  await mongo.collection('Files').insertOne(fileDetails);
  await client.close();

  res.redirect('/dash/files');
})

app.get('/dash/files/del/:id', async (req, res) => {
  await client.connect();
  let check = await mongo.collection('Files').deleteOne({ path: req.params.id});
  fs.unlink('./static/files/' + req.params.id, (err) => {});
  await client.close();
  res.redirect('/dash/files');
})

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/')
})

// --------------------------end of calls------------------------

app.listen(3000);
