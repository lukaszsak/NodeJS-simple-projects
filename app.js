const express = require('express');
const todoController = require('./controllers/todoController');
const multichatController = require('./controllers/multichatController');

const PORT = process.env.PORT || 3000;

const app = express();
const server = app.listen(PORT, () => console.log(`Listening on ${ PORT }`));

//set up template engine
app.set('view engine', 'ejs');

//static files
app.use(express.static('public'));

//fire controllers
todoController(app);
multichatController(server);

//Routes
app.get('/', function(req,res){
    res.render('index');
});
app.get('/multichat', function(req,res){
    res.render('multichat');
});