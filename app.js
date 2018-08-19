var express = require('express');
var todoController = require('./controllers/todoController');

var app = express();

//set up template engine
app.set('view engine', 'ejs');

//static files
app.use(express.static('./public'));

//fire controllers
todoController(app);

//listen to port
app.listen(process.env.PORT || 3000, function(){
    console.log('listening to port 3000');
});

app.get('/',function(req,res){
    res.render('index');
});


