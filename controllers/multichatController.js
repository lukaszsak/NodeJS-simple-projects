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
        // socket.emit('user-list',)
        var user = {socketID: socket.id,username:"Guest"};
        users.push(user);
        updateUsersList();

        socket.on('chat', function(data){
            io.sockets.emit('chat', data);
        });
    
        socket.on('typing', function(data){
            socket.broadcast.emit('typing',data);
        });

        socket.on('userchange', function(data){
            changeUser(socket.id,data);
            // console.log('user changed name',data,socket.id);
            // io.sockets.emit('userschange',users);
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