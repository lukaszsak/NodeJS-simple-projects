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
var broadcasting = true;

// Select chat Partner
function userClick(newPartnerID){
    if(newPartnerID != 'broadcast_user'){
        broadcasting = false;
        $("#chat-partner-header").html('You are chating with <strong>'+$("#"+newPartnerID).attr('data-user')+'</strong>');
    }else{
        broadcasting = true;
        $("#chat-partner-header").html('You are in <strong style="color:red;">BROADCAST</strong> mode');
    }

    if(chatPartnerID != null){
        $("#"+chatPartnerID).removeClass('bg-success');
    };
    chatPartnerID = newPartnerID;
    $("#"+chatPartnerID).addClass('bg-success');
}

// Bind 'Enter' on 'Message Area' with 'Send' button
$message.on('keyup', function(e){
    if(e.ctrlKey){
        if(e.keyCode == 13){
            message.value +='\n';
        }
    }
    if(e.keyCode == 13 && !e.ctrlKey){
        $sendBtn.click();
    }
});

// EMIT SOCKET EVENTS

// Login
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

// Typing a message
message.addEventListener('keypress', function(e){
    //don't emit nothing by empty message
    if(e.keyCode != 13 && !e.ctrlKey){
        if(broadcasting){
            socket.emit('typing broadcast message',$username.val());
        }else{
            socket.emit('typing send message', $("#"+chatPartnerID).attr('data-user') ,$username.val());
        }
    }
});

// Sending Message
$sendBtn.on('click', function(){
    //don't send empty message
    if($message.val() != "\n" && $message.val() != ""){
        if(broadcasting){
            socket.emit('broadcast message',$message.val());
        }else{
            var chatPartner = $("#"+chatPartnerID).attr('data-user');
            socket.emit('send message', chatPartner, $message.val());
        } 
    }
    $message.val("");
});

// LISTEN FOR SOCKET EVENTS

// Update users list
socket.on('get users', function(users){
    var usersList = "<li id='broadcast_user' data-user='BROADCAST' class='list-group-item' onclick='userClick(this.id)' style='color:red;'><strong>BROADCAST</strong> <i class='fa fa-envelope-o hidden'></i></li>";
    users.forEach(user => {
        if(user != $username.val()){
            usersList += "<li id='user_"+user+"' data-user='"+user+"' class='list-group-item' onclick='userClick(this.id)'>" + user + " <i class='fa fa-comment-o hidden'></i></li>";
        }
    });
    $users.html(usersList);

    // First time after Login - set BROADCAST user as default
    if(chatPartnerID == null){
        $("#broadcast_user").addClass('bg-success');
        chatPartnerID = "broadcast_user";
    }else{ // someone has joined of disconnected
        //check if chatParner is not disconnected
        //if not select him again as chat partner
        //else set user_broadcast as chat partner
        /// !!! Problem - we want to see conversation with someone
        /// also when he/she is disconnected -TODO

    }
});

// Someone is typing to us
socket.on('typing', function(data){
    feedback.innerHTML = '<p><em>' + data + ' is typing a message </em></p>';
});

// Received a message
socket.on('new message', function(data){
    var partner = $("#"+chatPartnerID);
    // not our current chat partner - show message icon
    if((data.user != $username.val()) &&  (data.user != partner.attr('data-user'))){
        $("#user_"+data.user+"> i").removeClass('hidden').addClass('blinker');
    }

    feedback.innerHTML = "";
    output.innerHTML += '<p><strong>' + data.user + ': </strong>' + data.msg + '</p>';
    output.scrollTop = output.scrollHeight;
});