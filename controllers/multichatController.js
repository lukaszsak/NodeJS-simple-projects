const socketIO = require('socket.io');

module.exports = function(server){

    const io = socketIO(server);

    io.on('connection', function(socket){
        console.log('made socket connection', socket.id);

        socket.on('chat', function(data){
            io.sockets.emit('chat', data);
        });
    
        socket.on('typing', function(data){
            socket.broadcast.emit('typing',data);
        });

    });
};