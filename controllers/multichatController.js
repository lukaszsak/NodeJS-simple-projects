const socketIO = require('socket.io');
var mongoose = require('mongoose');

//Connect to database --- zdaje sie ze pierwsze polaczenie z todoController wystarczy
// drugie wyglada jakbybylo ignorowane- zapisuje kolekcje do pierwszej bazy
// mongoose.connect('mongodb://test:test1pwd@ds022408.mlab.com:22408/multichat',{useNewUrlParser: true});

//Create a Schema
var chatsSchema = new mongoose.Schema({
    user: String,
    chats: [
        {
            chatPartner: String,
            messages: [
                {
                    user: String,
                    message: String
                }
            ]
        }
    ]
});

var Chats = mongoose.model('Chats',chatsSchema);

// var newChat = Chats({user: 'lukasz',chats: [{chatPartner:'dominika', messages: [{user:'lukasz',message:'hej domi :)'}]}]}).save(function(err,data){
//     if (err) throw err;
// });

// var testSchema = new mongoose.Schema({user: String});
// var test = mongoose.model('test',testSchema);
// var newTest =test({user:'lukasz'}).save(function(err,data){
//     if(err)throw err;
//     console.log(data);
// });


const users = [];
const connections = [];

module.exports = function(app, server){
    
    const io = socketIO(server);


    io.on('connection', function(socket){

        connections.push(socket);
        console.log('Connected : %s connections',connections.length);

        //Disconnect
        socket.on('disconnect', function(data){
            users.splice(users.indexOf(socket.username), 1);
            updateUsernames();

            connections.splice(connections.indexOf(socket),1);
            console.log('Disconnected: %s sockets connected', connections.length);
        });

        //New User - Login 
        socket.on('new user', function(username, callback){
            callback(username);
            socket.username = username;
            users.push(username);
            updateUsernames();
        });

        //Send Message to all users
        socket.on('broadcast message', function(message){
            console.log('broadcast message');
            console.log('message : ',message)
            io.sockets.emit('new message', {msg: message, user: socket.username});
        });

        //Send Message to a single user
        socket.on('send message', function(user, message){ //user- To( receiver)
            //sender - socket.username; receiver - user , msg - message
            // console.log('send message')
            // console.log('user',user, '     , message : ', message);

            ///update w bazie danych dla chatow nadawcy i odbiorcy
            // dla nadawcy - chatPartnerem bedzie odbiorca,
            // dla odbiorcy - chatPartnerem bedzie nadawca

            //Update chatu nadawcy
            Chats.find({user:socket.username},function(err,data){
                console.log("data : ",data);
                var chatPartner = user;
                if(data.length ==0){ //nowy chat
                    // console.log('Nowy chat - chat danego NADAWCY nie istnieje')
                    var newChat = Chats({user: socket.username ,chats: [{ chatPartner: chatPartner, messages: [{user: socket.username, message: message}] }] }).save(function(err,data){
                        if (err) throw err;
                    });
                }else{ //chat danego uzytkownika istnieje
                    // console.log('chat danego  NADAWCY ISTNIEJE')
                    var index = chatIndex(data[0].chats, chatPartner);
                    if( index != -1){ //chat z danym chatPartnerem istnieje
                        // console.log('chat z danym chatPartnerem istnieje')
                        data[0].chats[index].messages.push({user: socket.username, message: message});
                    }else{
                        // console.log('chat z danym chatPartnerem NIE istnieje')
                        data[0].chats.push({chatPartner: chatPartner,messages: [{user: socket.username, message: message}]});
                    }
                    Chats.updateOne({user: socket.username},{$set:{chats:data[0].chats}}, function(err,data){
                        console.log('updated successfullty');           
                    })
                }
            });

            //Update chatu odbiorcy
            Chats.find({user:user},function(err,data){
                console.log("data : ", data);
                var chatPartner = socket.username;
                if(data.length ==0){ //nowy chat
                    // console.log('Nowy chat - chat danego ODBIORCY nie istnieje')
                    var newChat = Chats({user: user ,chats: [{ chatPartner: chatPartner, messages: [{user: socket.username, message: message}] }] }).save(function(err,data){
                        if (err) throw err;
                    });
                }else{ //chat danego uzytkownika istnieje
                    // console.log('chat danego  ODBIORCY ISTNIEJE')
                    var index = chatIndex(data[0].chats, chatPartner);
                    if(index != -1){ //chat z danym chatPartnerem istnieje
                        // console.log('chat z danym chatPartnerem istnieje')
                        data[0].chats[index].messages.push({user: socket.username, message: message});
                    }else{
                        console.log('chat z danym chatPartnerem NIE istnieje')
                        data[0].chats.push({chatPartner: chatPartner,messages: [{user: socket.username, message: message}]});
                    }
                    Chats.updateOne({user: user},{$set:{chats:data[0].chats}}, function(err,data){
                        console.log('updated successfullty');           
                    })
                }
            });

            var chatIndex = function(chatList,chatPartner){
                var index = -1;
                for(var i=0;i<chatList.length;i++){
                    if(chatList[i].chatPartner == chatPartner){
                        index = i;
                        break;
                    };
                };
                return index;
            };

            // var newChat = Chats({user: user ,chats: [{ chatPartner: socket.username, messages: [{user: socket.username, message: message}] }] }).save(function(err,data){
            //     if (err) throw err;
            //     console.log(data);
            //     console.log(data['chats']);
            //     console.log(data.chats);
            //     console.log(data.chats[0].messages);
            // });

            // var query = {user: user};
            // var newValues = {$set:{chats}}

            for(i=0;i<connections.length;i++){
                if(connections[i].username == user){
                    connections[i].emit('new message', {msg: message, user: socket.username});
                    break;
                }
            }
            socket.emit('new message', {msg: message, user:socket.username});
        });

        function updateUsernames(){
            io.sockets.emit('get users', users);
        };

        //Get a socket of the user
        function getSocket(username){
            for(i=0;i<io.sockets.length;i++){
                if(io.sockets[i].username = username){
                    return io.sockets[i];
                }
            }
        }

        socket.on('typing broadcast message', function(data){
            // console.log(data);
            // console.log('typing broadcast messtage');
            socket.broadcast.emit('typing',data);
        });

        socket.on('typing send message', function(user, data){
            //sender - socket.username; receiver - user , msg - message
            // console.log(data);
            // socket.broadcast.emit('typing',data);
            // console.log('typing send messtage');
            // console.log('user : ',user)
            // console.log('data : ',data)

            for(i=0;i<connections.length;i++){
                // console.log(connections[i].username);
                if(connections[i].username == user){
                    connections[i].emit('typing', data);
                    break;
                }
            }
            // socket.emit('new message', {msg: message, user:socket.username});
        });

    });

    app.get('/multichat', function(req,res){
        res.render('multichat');
    });
};