const socketIO = require('socket.io');


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
            io.sockets.emit('new message', {msg: message, user: socket.username});
        });

        //Send Message to a single user
        socket.on('send message', function(user, message){
            //sender - socket.username; receiver - user , msg - message
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
            console.log('typing broadcast messtage');
            socket.broadcast.emit('typing',data);
        });

        socket.on('typing send message', function(user, data){
            //sender - socket.username; receiver - user , msg - message
            // console.log(data);
            // socket.broadcast.emit('typing',data);
            console.log('typing send messtage');
            console.log('user : ',user)
            console.log('data : ',data)


            for(i=0;i<connections.length;i++){
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