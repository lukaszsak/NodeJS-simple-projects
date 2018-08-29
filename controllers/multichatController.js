const socketIO = require('socket.io');

const users = [];

function changeUser(socketID,user){
    var newUser = true;
    for(i=0;i<users.length;i++){
        if(socketID == users[i].socketID){
            users[i].username = user;
            newUser = false;
            break;
        }
    }
    if(newUser){
        var user = {
            socketID: socketID,
            username: user
        }
        users.push(user);
    }
}

module.exports = function(app, server){
    
    const io = socketIO(server);


    io.on('connection', function(socket){
        console.log('made socket connection', socket.id);
        var user = {socketID: socket.id,username:"Guest"};
        users.push(user);
        updateUsersList();
        socket.emit('connection',socket.id);

        socket.on('chat', function(data){
            io.sockets.emit('chat', data);
        });

        socket.on('private-chat',function(data){
            // console.log('private chat received',data);
            var userSocket;
            //get socketID for a given user name
            for(i=0;i<users.length;i++){
                if(data.receiver == users[i].username){
                    userSocket = users[i].socketID;
                    break;
                }
            }
            io.sockets.sockets[userSocket].emit('private-chat',data);
            socket.emit('private-chat',data);
        });
    
        socket.on('typing', function(data){
            socket.broadcast.emit('typing',data);
        });

        socket.on('typing-private', function(data){

        })

        socket.on('userchange', function(data){
            changeUser(socket.id,data);
            updateUsersList();
        });

        socket.on('disconnect', function(){
            console.log('user disconnected',socket.id);
            deleteUser(socket.id);
            updateUsersList();
        })

    });

    function updateUsersList(){
        io.sockets.emit('userschange',users);
    }

    function deleteUser(socketID){
        var index = -1;

        for(i=0;i<users.length;i++){
            if(users[i].socketID == socketID){
                index = i;
            }
        }
        if ( index > -1){
            users.splice(index,1);
        }
    }

    app.get('/multichat', function(req,res){
        res.render('multichat');
    });
};