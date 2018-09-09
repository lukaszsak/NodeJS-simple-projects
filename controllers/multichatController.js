const socketIO = require('socket.io');
var mongoose = require('mongoose');

//Create a Schema
var chatsSchema = new mongoose.Schema({
    user: String,
    chats: [
        {
            chatPartner: String,
            messages: [
                {
                    sender: String,
                    body: String
                }
            ]
        }
    ]
});

var Chats = mongoose.model('Chats',chatsSchema);

//Store message to a database
function saveMessage(chatUser, chatPartner,message){ //message = { sender: , body: }
    Chats.find({user:chatUser}, function(err,data){
        if(data.length == 0){   //no chats Exists for a chatUser
            Chats({user: chatUser ,chats: [{ chatPartner: chatPartner, messages: [message] }] }).save(function(err,data){
                if (err) throw err;
            });
        }else{ // chatUser have some chats saved
            var index = chatIndex(data[0].chats, chatPartner);
            if(index != -1){ //chat with chatPartner exists
                data[0].chats[index].messages.push(message);
            }else{ //chat with chatPartner doesn't exists
                data[0].chats.push({chatPartner: chatPartner,messages: [message]});
            }
            Chats.updateOne({user: chatUser},{$set: {chats: data[0].chats}}, function(err,data){
            })
        }
    });
};

//Get all messages of a given user from a database
function getMessages(chatUser, socket){
    Chats.find({user: chatUser}, function(err,data){
        if(data.length !=0){
            var chats = [];
            for(i=0;i<data[0].chats.length;i++){
                // var chat = {chatPartner: data[0].chats[i].chatPartner};
                var messages = [];
                for(j=0;j<data[0].chats[i].messages.length;j++){    
                    var message = {
                        sender: data[0].chats[i].messages[j].sender,
                        body: data[0].chats[i].messages[j].body
                    }
                    messages.push(message);
                }
                var chat = {
                    chatPartner: data[0].chats[i].chatPartner,
                    messages: messages
                }
                chats.push(chat);
            }
            socket.emit('get messages', chats);
            return data[0].chats;
        }else{
            socket.emit('get messages', []);
            return [];
        }
    })
};

function chatIndex(chatList,chatPartner){
    var index = -1;
    for(var i=0;i<chatList.length;i++){
        if(chatList[i].chatPartner == chatPartner){
            index = i;
            break;
        };
    };
    return index;
};

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
            getMessages(username,socket);
        });

        //Send Message to all users
        socket.on('broadcast message', function(message){
            //update chatu dla wszystkich dostepnych online
            for(i=0;i<connections.length;i++){
                if(connections[i] != socket){
                    saveMessage(connections[i].username, socket.username, message);
                }
            }
            io.sockets.emit('new message', {msg: message, user: socket.username});
        });

        //Send Message to a single user
        socket.on('send message', function(user, message){
            //Nadawca - socket.username; Odbiorca - user
            
            //Update chatu nadawcy
            saveMessage(socket.username, user, message);
            //Update chatu odbiorcy
            saveMessage(user, socket.username, message);

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

        socket.on('typing broadcast message', function(){
            socket.broadcast.emit('typing',socket.username);
        });

        socket.on('typing send message', function(receiver){
            for(i=0;i<connections.length;i++){
                if(connections[i].username == receiver){
                    connections[i].emit('typing', socket.username);
                    break;
                }
            }
        });
    });

    app.get('/multichat', function(req,res){
        res.render('multichat');
    });
};