//make connection
var socket =io();

//Query DOM
var $message = $('#message'),
    $sendBtn = $('#send'),
    $output = $('#output'),
    $feedback = $('#feedback'),
    $users = $('#users-list'),

    $loginBtn = $('#loginBtn'),
    $username = $('#username');

var chatPartnerID = null;

var privateChat = false;
// var receiverSocketID = null;
var receiverName = null;
var broadcasting = true;

//Emit events

//Send Message
$sendBtn.on('click', function(){
    if(broadcasting){
        socket.emit('broadcast message',$message.val());
    }else{
        var chatPartner = $("#"+chatPartnerID).html();
        socket.emit('send message', chatPartner, $message.val());
    }
    $message.val("");
});

//Login
$loginBtn.on('click', function(e){
    e.preventDefault();
    socket.emit('new user', $username.val(), function(user){
        if(user){
            $("#LoginForm").hide();
            $("#chatForm").show();
            document.getElementById("nn").innerHTML = user;
        }
    });
});

////// need improvement - send only to chatPartner or broadcast
message.addEventListener('keypress', function(){
    socket.emit('typing',user);
});

//Bind 'Enter' on 'Message Area' with 'Send' button
$message.on('keyup', function(e){
    if(e.ctrlKey){
        if(e.keyCode == 13){
            message.value +='\n';
        }
    }
    if(e.keyCode == 13 && !e.ctrlKey){
        $sendBtn.click();
    }
})

//Listen for events

//Update users list
socket.on('get users', function(users){
    var usersList = "<li id='broadcast_user' class='list-group-item' onclick='userClick(this.id)' style='color:red;'><strong>BROADCAST</strong></li>";
    users.forEach(user => {
        usersList += "<li id='user_"+user+"' class='list-group-item' onclick='userClick(this.id)'>" + user + "</li>";
    });
    $users.html(usersList);
});

//select chat Partner
function userClick(newPartnerID){
    if(newPartnerID != 'broadcast_user'){
        broadcasting = false;
    }else{
        broadcasting = true;
    }
    console.log("broadcasting : ",broadcasting);    

    if(chatPartnerID != null){
        $("#"+chatPartnerID).removeClass('bg-success');
    };
    chatPartnerID = newPartnerID;
    $("#"+chatPartnerID).addClass('bg-success');
    $("#chat-partner-header").html('You are chating with <strong>'+$("#"+chatPartnerID).html()+'</strong>');
}

socket.on('typing', function(data){
    feedback.innerHTML = '<p><em>' + data + ' is typing a message </em></p>';
});

socket.on('new message', function(data){
    feedback.innerHTML = "";
    output.innerHTML += '<p><strong>' + data.user + ': </strong>' + data.msg + '</p>';
    output.scrollTop = output.scrollHeight;
});