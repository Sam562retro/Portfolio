const express = require('express');
const app = express();
const path = require('path');


app.set('view engine', 'ejs');
app.use(express.static(path.resolve(__dirname, './static')));

app.get('/', (req, res) => {
  res.render('home')
})

app.listen(3000);
