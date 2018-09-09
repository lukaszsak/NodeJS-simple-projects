//make connection
var socket =io();

//Query DOM
    //Login section view
var $loginBtn = $('#loginBtn'),
    $username = $('#username');
    //chat section view
var $message = $('#message'),
    $sendBtn = $('#send'),
    $output = $('#output'),
    $feedback = $('#feedback'),
    $users = $('#users-list'),
    $loginNameInfo = $("#nn");

//// FRONTEND STATE
var State = function(){
    //Login
    var userName = "";
    var userID = "";
    //Chat
    var chatPartnerName = "BROADCAST";   //current ChatPartner - default is BROADCAST
    var chatPartnerID = "broadcast_user";
    var chats = [{chatPartner:chatPartnerName,messages:[]}];//Each ChatPartner - separate Chat
    /*  STRUCTURE OF single chat in chats
        chat = {
            chatPartner: string,
            messages: [{sender: string, body: string}]
        }
    */
    var onlineUsers = [];
    /* STRUCTURE of single ONLINEUSER in onlineUsers
        onlineUser = {username: string, unreadMessage: 'true/false'}
    */
    //Flags 
    var isBroadcasting = true;    //current ChatPartner == BROADCASTING
    var isTyping = false;      // current ChatPartner is writing to us

    ///// STATE and VIEW UPDATE FUNCTIONS

    //get chat with a given user from chats
    function getChat(chatPartner){
        for(i=0;i<chats.length;i++){
            if(chats[i].chatPartner == chatPartner){
                return chats[i];
            }
        }
    }    

    var setUserNameCallback = function(username){
        // Set State
        userName = username;
        setUserID("user_"+username);
        // Update View
        $loginNameInfo.html(userName);
    }

    var setUserID = function(user){
        userID = user;
    }

    var setChatPartnerName = function(partnerName){
        chatPartnerName = partnerName;
    }

    var setChatPartnerID = function(partnerID){
        chatPartnerID = partnerID;
    };
    
    var chatPartnerNameCallback = function(partnerName){
        chatPartnerName = partnerName;
        setChatPartnerID("user_"+partnerName);
    }

    var messageReceivedCallback = function(data){
        var chatPartner = data.user == userName ? chatPartnerName : data.user;
        if( chatPartnerName != data.user){
            $("#user_"+data.user +" > i").removeClass('hidden').addClass('blinker');
        }

        if(chatPartner == "BROADCAST"){
            /// dla kazdego chata dodaj wiadomosc
            for(var i=0;i<chats.length;i++){
                chats[i].messages.push({sender: data.msg.sender, body: data.msg.body});

            }
        }else{
            var index = chatIndex(chatPartner);
            if(index != -1){
                chats[index].messages.push({sender:data.msg.sender, body: data.msg.body});
            }else{
                var chat = {chatPartner: chatPartner, messages:[{sender: data.msg.sender, body: data.msg.body}]};
                chats.push(chat);
            }
        }
        updateChatsView();
    };

    var updateChatsView = function(){
        var index = chatIndex(chatPartnerName);
        var chat;
        if(index != -1){    //nie ma  historii chatu z danym chatPartnerem
            chat = chats[index].messages;
        }else{
            chat = [];
        }
        var html = "";
        for(i=0;i<chat.length;i++){
            html += "<p><strong>"+chat[i].sender+": </strong>"+chat[i].body+"</p>";
        }
        $output.html(html);
        // $output.scrollTop($output.height());
        output.scrollTo(0,output.scrollHeight);
    };

    var chatIndex = function(username){
        var index = -1; //doesn't exist
        for(i=0;i<chats.length;i++){
            if(chats[i].chatPartner == username){
                index = i;
                break;
            };
        };
        return index;
    };

    var setOnlineUsersCallback = function(onlineusers){
        updateOnlineUsersList(onlineusers);
        updateChatPartner();
        // updateChats();  // Must be after onlineUsers Update !!!
        updateOnlineUsersView();
        updateChatPartnerView();
    };

    var updateChats = function(){
        for(var i=0;i<onlineUsers.length;i++){
            var index = chatIndex(onlineUsers[i].userName);
            if(index == -1){ //new user
                var chat = { chatPartner: onlineUsers[i].userName,messages:[]};
                chats.push(chat);
            };
        };
    };

    var updateOnlineUsersList = function(onlineusers){
        var newOnlineUsers = [];
        for(var i= 0;i<onlineusers.length;i++){
            var index = onlineUserIndex(onlineusers[i]);
            if(index != -1){    //user exists
                newOnlineUsers.push(onlineUsers[index]);
            }else{  //user doesn't exists
                newOnlineUsers.push({userName: onlineusers[i], unreadMessage : false});
            };
        };
        onlineUsers = newOnlineUsers;
    };

    var updateChatPartner = function(){
        if(onlineUserIndex(chatPartnerName) ==-1){
            setChatPartnerName('BROADCAST');
            setChatPartnerID('broadcast_user');
        };
    };

    var updateChatPartnerView = function(){
        $("#"+state.getChatPartnerID()).addClass('bg-success');
        updateChatsView();
    };

    var updateOnlineUsersView = function(){
        var usersList = "<li id='broadcast_user' data-user='BROADCAST' class='list-group-item' onclick='state.selectChatPartner(this.id)' style='color:red;'><strong>BROADCAST</strong></li>";
        onlineUsers.forEach(user => {
            if(user.userName != state.getUserName()){
                var messageIcon = user.unreadMessage==true ? "" : "hidden";
                usersList += "<li id='user_"+user.userName+"' data-user='"+user.userName+"' class='list-group-item' onclick='state.selectChatPartner(this.id)'>" + user.userName + " <i class='fa fa-comment-o "+messageIcon+"'></i></li>";
            };
        });
        $users.html(usersList);
    };

    var onlineUserIndex = function(username){
        var index = -1;
        for(i=0;i<onlineUsers.length;i++){
            if(onlineUsers[i].userName == username){
                index = i;
                break;
            }
        }
        return index;
    };

    var selectChatPartner = function(newPartnerID){
        $("#"+chatPartnerID).removeClass('bg-success');
        chatPartnerID = newPartnerID;
        chatPartnerName = $("#"+newPartnerID).attr('data-user');
        $("#"+chatPartnerID).addClass('bg-success');
        $("#"+chatPartnerID+">i").addClass('hidden').removeClass('blinker');

        if(newPartnerID != 'broadcast_user'){
            isBroadcasting = false;
            $("#chat-partner-header").html('You are chating with <strong>'+chatPartnerName+'</strong>');
        }else{
            isBroadcasting = true;
            $("#chat-partner-header").html('You are in <strong style="color:red;">BROADCAST</strong> mode');
        }

        updateChatsView();
    };

    return {
        getUserName : () => userName,
        setUserName : setUserNameCallback,

        getUserID : () => userID,
        setUserID : setUserID,

        getChatPartnerName : () => chatPartnerName,
        setChatPartnerName : (partnerName) => chatPartnerNameCallback(partnerName),

        getChatPartnerID : () => chatPartnerID,
        setChatPartnerID : (id) => setChatPartnerID(id),
        
        getChats: () => chats,
        setChats: (_chats) => {chats = _chats;},
        getChat : getChat,
        messageReceived: (data) => messageReceivedCallback(data),

        getOnlineUsers: () => onlineUsers,
        setOnlineUsers: (onlineusers) => setOnlineUsersCallback(onlineusers),
        
        getBroadcasting: () => isBroadcasting,
        setBroadcasting: (broadcasting) => {isBroadcasting = broadcasting;},
        
        getTyping: () => typing,
        setTyping: (typing) => {isTyping = typing;},
        selectChatPartner : (id) => selectChatPartner(id)
    };
};

var state = State();

// Bind 'Enter' on 'Message Area' with 'Send' button
$message.on('keyup', function(e){
    if(e.ctrlKey && (e.keyCode == 13) ){ //ctrl + return - go to next line without sending
        // if(e.keyCode == 13){
            message.value +='\n';
        // }
    }   //tylko ze to pozniej jest renderowane i tak w jednej linii --TODO
    if(e.keyCode == 13 && !e.ctrlKey){ //just return - send message
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
            state.setUserName(user);
        }
    });
});

// Typing a message
message.addEventListener('keypress', function(e){
    var partner = state.getChatPartnerName();
        if(state.getBroadcasting()){
            socket.emit('typing broadcast message');
        }else{
            socket.emit('typing send message', partner);
        }
});

// Sending Message
$sendBtn.on('click', function(){
    //don't send empty message
    if($message.val() != "\n" && $message.val() != ""){
        var message = {sender: state.getUserName(), body: $message.val()};
        if(state.getBroadcasting()){
            socket.emit('broadcast message',message);
        }else{
            var chatPartner = state.getChatPartnerName();
            socket.emit('send message', chatPartner, message);
        } 
    }
    $message.val("");
});

// LISTEN FOR SOCKET EVENTS

// Update users list
socket.on('get users', function(users){
    state.setOnlineUsers(users);
});

// Someone is typing to us
socket.on('typing', function(user){
    feedback.innerHTML = '<p><em>' + user + ' is typing a message </em></p>';
});

// Received a message
socket.on('new message', function(data){
    feedback.innerHTML = "";
    state.messageReceived(data);
});

socket.on('get messages', function(messages){
    var chats = state.getChats();
    for(i=0;i<messages.length;i++){
        chats.push(messages[i]);
    }
    state.setChats(chats); 
});