

//make connection
var socket =io();

var socketID;

//Query DOM
var message = document.getElementById('message'),
    handle = document.getElementById('handle'),
    btn = document.getElementById('send'),
    output = document.getElementById('output'),
    feedback = document.getElementById('feedback'),
    usersList = document.getElementById('connected-users');

var privateChat = false;
// var receiverSocketID = null;
var receiverName = null;

//Emit events
btn.addEventListener('click', function(){
    if(privateChat){
        var data = {
            // receiverSocketID: receiverSocketID,
            // senderSocketID: socket.id,
            receiver: receiverName,
            message: message.value,
            handle: handle.value 
        }
        socket.emit('private-chat',data);
    }else{
        socket.emit('chat',{
            message: message.value,
            handle: handle.value
        });
    }
    
    message.value = "";
});
message.addEventListener('keypress', function(){
    socket.emit('typing',handle.value);
});

handle.addEventListener('change',function(){
    socket.emit('userchange',handle.value);
})
message.addEventListener('keyup', function(e){
    if(e.ctrlKey){
        if(e.keyCode == 13){
            message.value +='\n';
        }
    }
    if(e.keyCode == 13 && !e.ctrlKey){
        btn.click();
    }
})

//Listen for events
socket.on('connection', function(data){
    socketID = data;
});

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
    $('#connected-users > li').addClass('active-user');

    $('#connected-users > li').on('click', function(e){
        if(privateChat){
            privateChat = false;
            $('#connected-users > li').addClass('active-user');
            console.log('in multichat');
        }else{
            privateChat = true;
            receiverName = e.target.innerHTML;
            console.log('in private chat with ',receiverName);
            console.log(e.target);
            // e.target.style('color','red');
            $('#connected-users > li').removeClass('active-user');
            $(this).addClass('active-user');
            // $(this).css('background-color','red');
            // $(this).attr("visibility", "0.5");

        }
    });
});

socket.on('private-chat', function(data){
    // console.log('private chat',data);
    feedback.innerHTML = "";
    output.innerHTML += '<p><strong>' + data.handle + ': </strong>' + data.message + '</p>'
});
