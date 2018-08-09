var bodyParser = require('body-parser');
var mongoose = require('mongoose');

//Connect to database
mongoose.connect('mongodb://test:test@ds247078.mlab.com:47078/todo',{useNewUrlParser: true});

//Create a Schema
var todoSchema = new mongoose.Schema({
    item: String
});

var Todo = mongoose.model('Todo',todoSchema);

var urlencodedParser = bodyParser.urlencoded({extended: false});

module.exports = function(app){

app.get('/todo', function(req,res){
    //get data from mongodb and pass it to the view
    Todo.find({}, function(err, data){
        if (err) throw err;
        res.render('todo', {todos:data});
    });
});

app.post('/todo', urlencodedParser, function(req,res){
    //get data from the view and add it to mongodb
    var newTodo = Todo(req.body).save(function(err, data){
        if (err) throw err;
        res.json(data);
    });
});

app.delete('/todo/:item', function(req,res){
    //delete the requested data from mongodb
    Todo.find({item: req.params.item.replace(/\-/g, ' ')}).remove(function(err, data){
        if (err) throw err;
        res.json(data);
    });
});

};