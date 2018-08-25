//make connection
var socket =io();

//Query DOM
var message = document.getElementById('message'),
    handle = document.getElementById('handle'),
    btn = document.getElementById('send'),
    output = document.getElementById('output'),
    feedback = document.getElementById('feedback'),
    usersList = document.getElementById('connected-users');

//Emit events
btn.addEventListener('click', function(){
    socket.emit('chat',{
        message: message.value,
        handle: handle.value
    });
    message.value = "";
});
message.addEventListener('keypress', function(){
    socket.emit('typing',handle.value);
});

handle.addEventListener('change',function(){
    socket.emit('userchange',handle.value);
})
message.addEventListener('keyup', function(e){
    // if(e.ctrlKey){
    //     if(e.keyCode == 13){
    //         message.value +='\n';
    //     }
    // }
    if(e.keyCode == 13 && !e.ctrlKey){
        btn.click();
    }
})

//Listen for events
socket.on('chat', function(data){
    feedback.innerHTML = "";
    output.innerHTML += '<p><strong>' + data.handle + ': </strong>' + data.message + '</p>'
});
socket.on('typing', function(data){
    feedback.innerHTML = '<p><em>' + data + ' is typing a message </em></p>';
});
socket.on('userschange',function(data){
    var innerHtml = "";
    for(i=0;i<data.length;i++){
        innerHtml +="<li>"+data[i].username+"</li>";
    }
    usersList.innerHTML = innerHtml;
    
});