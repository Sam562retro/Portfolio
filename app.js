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

app.get('/', async (req, res) => {
  await client.connect();
  const guitarCovers = await mongo.collection('Guitar').find({ embed: { $ne : "tags" } }).toArray();
  await client.close();
  res.render('home', { guitarCovers });
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

app.get('/dash/guitar', async (req, res) => {
  await client.connect();
  const covers = await mongo.collection('Guitar').find({ embed: { $ne : "tags" } }).toArray();
  const tags = await mongo.collection('Guitar').findOne({embed: "tags"});
  await client.close();
  res.render('dashboard', {type: 'guitar', covers, tags});
});

app.post('/dash/guitar/addTag', async (req, res) => {
  await client.connect();
  await mongo.collection('Guitar').updateOne({embed: "tags"}, { $push: { tags: req.body.tagName } })
  await client.close();
  res.redirect('/dash/guitar');
})

app.post('/dash/guitar', async (req, res) => {
  let m = {name: req.body.songName, artist: req.body.songArtist, embed: req.body.embedLink, youtube: req.body.youtube, tabs: req.body.tabsId, tags: req.body.tagsSelect}
  await client.connect();
  await mongo.collection('Guitar').insertOne(m);
  await client.close();
  console.log(m);
  res.redirect("/dash/guitar");
});

app.get('/dash/guitar/del/:id', async (req,res) => {
  await client.connect();
  await mongo.collection('Guitar').deleteOne({_id: new ObjectId(req.params.id)});
  await client.close();
  res.redirect("/dash/guitar");
})

app.get('/dash/code', async (req, res) => {
  await client.connect();
  const projects = await mongo.collection('Code').find().sort({priority:1}).toArray();
  await client.close();
  res.render('dashboard', {type: 'code', projects});
})

app.post('/dash/code', async (req, res) => {
  let m = {priority: parseInt(req.body.projectPriority), name: req.body.projectName, date: req.body.projectDate, pic: req.body.projectPic, description: req.body.projectDescription, techStack: req.body.projectTech, funFact: req.body.projectFunFact, github: req.body.projectGithub, youtube: req.body.projectYt, win: req.body.projectWin, site: req.body.projectLiveSite}
  await client.connect();
  await mongo.collection('Code').insertOne(m);
  await client.close();
  console.log(m);
  res.redirect("/dash/code");
})

app.get('/dash/code/del/:id', async (req,res) => {
  await client.connect();
  await mongo.collection('Code').deleteOne({_id: new ObjectId(req.params.id)});
  await client.close();
  res.redirect("/dash/code");
})

app.get('/dash/blogEntry', async (req, res) => {
  await client.connect();
  await client.close();
  res.render('dashboard', {type: 'blogEntry'});
})

app.get('/markdown', (req, res) => {
  res.render('markdownEditor');
})

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/')
})

// --------------------------end of calls------------------------

app.listen(3000);
