const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const fileUpload = require('express-fileupload');
require('dotenv').config({ path: 'secret.env' });
const fs = require('fs');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

const client = new MongoClient(process.env.MONGO_PATH, {
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

const mongo = client.db(process.env.DB_NAME);

app.use('/dash', (req, res, next) => {
  if(req.session.user){
    next();
  }else{
    res.redirect('/admin');
  }
});


// ------------------------pages---------------------------

app.get('/', async (req, res) => {
  await client.connect();
  const guitarCovers = await mongo.collection('Guitar').find({ embed: { $ne : "tags" } }).toArray();
  const recentLawBlog = await mongo.collection('Blogs').find({category: "law"}).sort({date: -1}).limit(3).toArray();
  await client.close();
  res.render('home', { guitarCovers, recentLawBlog });
})

app.get('/mobile', async(req, res) => {
  res.render("mobile");
})

app.get('/law/blog', async(req, res) => {
  await client.connect();
  const recentLawBlog = await mongo.collection('Blogs').find({category: "law"}).sort({date: -1}).limit(1).toArray();
  const blogList = await mongo.collection('Blogs').find({category: "law"}).sort({date: -1}).project({title: 1, date: 1}).toArray();
  await client.close();
  res.render('blogDisplay', {blogToShow: recentLawBlog[0], blogList, category: "law"})
})

app.get('/law/blog/:id', async (req, res) => {
  await client.connect();
  const blogToShow = await mongo.collection('Blogs').findOne({_id: new ObjectId(req.params.id)});
  const blogList = await mongo.collection('Blogs').find({category: "law"}).sort({date: -1}).project({title: 1, date: 1}).toArray();
  await client.close();
  res.render('blogDisplay', {blogToShow, blogList, category: "law"})
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
  if (req.body.user == process.env.AD_ID && req.body.pass == process.env.AD_PASSWORD){
    req.session.user = process.env.AD_RANDOM;
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
  const blogsData = await mongo.collection('Blogs').find().sort({date:-1}).toArray();
  await client.close();
  res.render('dashboard', {type: 'blogEntry', blogsData});
})

app.get('/dash/markdown', (req, res) => {
  res.render('partials/markdownEditor', {edit: false});
})

app.get('/dash/markdown/edit/:id', async (req, res) => {
  await client.connect();
  const fileData = await mongo.collection('Blogs').findOne({_id: new ObjectId(req.params.id)});
  await client.close();
  res.render('partials/markdownEditor', {edit: true, fileData});
})

app.post('/dash/markdown', fileUpload(), async (req, res) => {
  let blog = {
      title: req.body.title,
      category: req.body.category,
      content: req.body.content.replace(/\r/g, "\\r").replace(/\n/g, "\\n"),
      date: new Date()
    };
  await client.connect();
  const result = await mongo.collection('Blogs').insertOne(blog);
  await client.close();
  console.log(blog);
  res.json({works: true, edit: false, url: `/${blog.category}/blog/${result.insertedId}`});
})

app.post('/dash/markdown/edit/:id', fileUpload(), async (req, res) => {
  let blog = {
      title: req.body.title,
      category: req.body.category,
      content: req.body.content.replace(/\r/g, "\\r").replace(/\n/g, "\\n"),
    };
  await client.connect();
  const upd = await mongo.collection("Blogs").updateOne({_id: new ObjectId(req.params.id)},{$set: blog}, { upsert: false });
  await client.close();
  res.json({works: true, edit: true, url: `/${blog.category}/blog/${req.params.id}`});
})

app.get('/dash/markdown/del/:id', async (req, res) => {
  await client.connect();
  await mongo.collection('Blogs').deleteOne({_id: new ObjectId(req.params.id)});
  await client.close();
  res.redirect('/dash/blogEntry');
})

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/')
})

// --------------------------end of calls------------------------

app.listen(3000);
