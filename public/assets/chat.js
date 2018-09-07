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
    var chats = [{chatPartner:chatPartnerName,messages:[]}];//[{chatPartner:'Lukasz',messages:[{sender: 'lukasz',message:"moja wiadomosc -od Lukasza"}]}]; //Each ChatPartner - separate Chat
    // var chats = [];
    //onlineUser = {username: username, unreadMessage: true/false }
    var onlineUsers = [];//['domi','lukasz','nikto'];
    //Flags
    var isBroadcasting = true;    //current ChatPartner == BROADCASTING
    var isTyping = false;      // current ChatPartner is writing to us

    ///// STATE and VIEW UPDATE FUNCTIONS

    function userNameViewUpdate(){
        $loginNameInfo.html(this.userName);
    };

    //get chat with a given user from chats
    function getChat(chatPartner){
        for(i=0;i<chats.length;i++){
            if(chats[i].chatPartner == chatPartner){
                return chats[i];
            }
        }
    }
    
    function chatStateUpdate(data){
        var chat = getChat(data.user);
        chat.message = data.msg;
    };

    function chatViewUpdate(){
        var chat = getChat(this.chatPartnerName);
        $output.html(chat.message);
        
    };

    function onlineUsersStateUpdate(users){
        var newOnlineUsers = [];
        var isNewUser;
        var newUser;
        for(i=0;i<users.length;i++){
            isNewUser = true;
            for(j=0;j<onlineUsers.length;j++){
                if(users[i] == onlineUsers[j].userName){    //the same users
                    newUser = onlineUsers[j]; 
                    isNewUser = false;
                    break;
                }
            }
            if(isNewUser){
                newUser={
                    userID: 'user_'+users[i],
                    userName: users[i],
                    unreadMessage: false
                }
                // Add an empty Chat to chatList
                var chat = { chatPartner: users[i], chat: []};
            }
            if(newUser.userName != userName){
                newOnlineUsers.push(newUser);
            }
        }
        onlineUsers = newOnlineUsers;
    };

    function onlineUsersViewUpdate(){
        var usersList = "<li id='broadcast_user' data-user='BROADCAST' class='list-group-item' onclick='selectChatPartner(this.id)' style='color:red;'><strong>BROADCAST</strong> <i class='fa fa-envelope-o'></i></li>";
        var messageIcon;
        onlineUsers.forEach(user => {
            user.unreadMessage ? messageIcon = "" : messageIcon = "hidden";
            usersList += "<li id='user_"+user.userName+"' data-user='"+user.userName+"' class='list-group-item' onclick='selectChatPartner(this.id)'>" + user.userName + " <i class='fa fa-comment-o "+messageIcon+"'></i></li>";
        });
        $users.html(usersList);
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

    var setChatPartnerID = function(id){
        chatPartnerID = id;
    }

    var messageReceivedCallback = function(data){
        // console.log(data);
        // console.log(userName);
        var chatPartner = data.user == userName ? chatPartnerName : data.user;
        // console.log('chatPartner : ', chatPartner);
        // console.log('chats : ',chats);
        if( chatPartnerName != data.user){
            $("#user_"+data.user +" > i").removeClass('hidden').addClass('blinker');
        }

        if(chatPartner == "BROADCAST"){
            /// dla kazdego chata dodaj info
            // for(var i=0;i<onlineUsers.length;i++){
            for(var i=0;i<chats.length;i++){    //Broadcast user - extra one user
                chats[i].messages.push({user:data.user, message:data.msg});
            }
        }else{
            // if(chatIndex(chatPartner) != -1){ //chat Exists
            var index = chatIndex(chatPartner);
            // console.log(index);
            chats[chatIndex(chatPartner)].messages.push({user:data.user, message: data.msg});
            // }
        }
        // console.log(chats);
        updateChatsView();
        // if(chatIndex(data.user) != -1){ //chat Exists
        //     chats[i].messages.push({user: data.user, message: data.msg});
        // }else{
        //     var chat = {
        //         chatPartner: data.username,
        //         messages: [{user: data.user, message:data.msg}]
        //     }
        //     chats.push(chat);
        // }
    };

    var updateChatsView = function(){
        var index = chatIndex(chatPartnerName);
        // console.log('chats - ',chats);
        // console.log('partnername - ',chatPartnerName);
        // console.log('index - ',index);
        // console.log('index ----',index);
        // console.log('chatPartnerName ---', chatPartnerName);
        var chat = chats[index].messages;
        // console.log(chat);
        var html = "";
        for(i=0;i<chat.length;i++){
            html += "<p><strong>"+chat[i].user+": </strong>"+chat[i].message+"</p>";
        }
        // var html = $output.html();
        // html += 'hejka ---  ';
        $output.html(html);
        // alert('ok')
        // $output.html(chats[index]);
        // console.log(chats[index]);
        // $output.html('co porabiasz')
    }

    var chatIndex = function(username){
        // console.log('chats in chatIndex function : ',chats);
        // console.log('username - ',username);
        var index = -1; //doesn't exist
        for(i=0;i<chats.length;i++){
            // console.log('chat partner - ',chats[i].chatPartner);
            if(chats[i].chatPartner == username){
                index = i;
                break;
            }
        }
        return index;
    }

    // var setChat = function(chatPartner, message){

    // }

    var setOnlineUsersCallback = function(onlineusers){
        updateOnlineUsersList(onlineusers);
        updateChatPartner();
        updateChats();  // Must be after onlineUsers Update !!!
        updateOnlineUsersView();
        updateChatPartnerView();
    }

    var updateChats = function(){
        for(var i=0;i<onlineUsers.length;i++){
            var index = chatIndex(onlineUsers[i].userName);
            if(index == -1){ //new user
                var chat = { chatPartner: onlineUsers[i].userName,messages:[]};
                chats.push(chat);
                // console.log('chat inserted - new, onlineUsers[i]:',onlineUsers[i]);
            }
        }
    }

    var updateOnlineUsersList = function(onlineusers){
        var newOnlineUsers = [];
        for(var i= 0;i<onlineusers.length;i++){
            var index = onlineUserIndex(onlineusers[i]);
            if(index != -1){    //user exists
                newOnlineUsers.push(onlineusers[i]);
            }else{  //user doesn't exists
                newOnlineUsers.push({userName: onlineusers[i], unreadMessage : false});
            }
        }
        onlineUsers = newOnlineUsers;
    };

    var updateChatPartner = function(){
        if(onlineUserIndex(chatPartnerName) ==-1){
            setChatPartnerName('BROADCAST');
            setChatPartnerID('broadcast_user');
        }
    }

    var updateChatPartnerView = function(){
        $("#"+state.getChatPartnerID()).addClass('bg-success');
        updateChatsView();
        // console.log('update chats view invoked - ')
    }

    var updateOnlineUsersView = function(){
        var usersList = "<li id='broadcast_user' data-user='BROADCAST' class='list-group-item' onclick='state.selectChatPartner(this.id)' style='color:red;'><strong>BROADCAST</strong></li>";
        onlineUsers.forEach(user => {
            if(user.userName != state.getUserName()){
                var messageIcon = user.unreadMessage==true ? "" : "hidden";
                usersList += "<li id='user_"+user.userName+"' data-user='"+user.userName+"' class='list-group-item' onclick='state.selectChatPartner(this.id)'>" + user.userName + " <i class='fa fa-comment-o "+messageIcon+"'></i></li>";
            }
        });
        $users.html(usersList);
    }

    var onlineUserIndex = function(username){
        var index = -1;
        for(i=0;i<onlineUsers.length;i++){
            if(onlineUsers[i].user == username){
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
        $("#"+chatPartnerID+">i").addClass('hidden').removeClass('blinker');//wlasciwie nie trzeba usuwac blinker skore bedzie hidden

        if(newPartnerID != 'broadcast_user'){
            isBroadcasting = false;
            $("#chat-partner-header").html('You are chating with <strong>'+chatPartnerName+'</strong>');
        }else{
            isBroadcasting = true;
            $("#chat-partner-header").html('You are in <strong style="color:red;">BROADCAST</strong> mode');
        }

        updateChatsView();
        // state.showState();
    };


    return {
        showState : () => console.log('userName: ', userName, "\nuserID: ",userID, "\nchatPartnerName: ", chatPartnerName, "\nchatPartnerID: ",chatPartnerID, "\nchats: ",chats, "\nonlineUsers: ",onlineUsers, "\nisBroadcasting: ",isBroadcasting, "\nisTyping: ",isTyping),

        getUserName : () => userName,
        setUserName : setUserNameCallback,//{userName = user;setUserID("user_"+user)},


        getUserID : () => userID,
        setUserID : setUserID,//(user_id) => {userID = user_id;},

        getChatPartnerName : () => chatPartnerName,
        setChatPartnerName : (partnerName) => chatPartnerNameCallback(partnerName),//{setChatPartnerName(partnerName), setChatPartnerID("user_"+partnerName),  //(partnerName) =>{chatPartnerName = partnerName;},

        getChatPartnerID : () => chatPartnerID,
        setChatPartnerID : (id) => setChatPartnerID(id),//(chatPartner_id) => {chatPartnerID = chatPartner_id;},
        
        getChats: () => chats,
        setChats: (_chats) => {chats = _chats;},
        getChat : getChat,
        // setChat : setChat,
        messageReceived: (data) => messageReceivedCallback(data),//{chatStateUpdate(data); chatViewUpdate();}, //function


        getOnlineUsers: () => onlineUsers,
        setOnlineUsers: (onlineusers) => setOnlineUsersCallback(onlineusers),//(users) => {onlineUsersStateUpdate(users);}, //function
        
        getBroadcasting: () => isBroadcasting,
        setBroadcasting: (broadcasting) => {isBroadcasting = broadcasting;},
        
        getTyping: () => typing,
        setTyping: (typing) => {isTyping = typing;},
        selectChatPartner : (id) => selectChatPartner(id)
    }
}

var state = State();


////// FUNCTIONS

// function updateOnlineUsersList(users){
//     var newOnlineUsers = [];
//     var isNewUser;
//     var newUser;
//     for(i=0;i<users.length;i++){
//         isNewUser = true;
//         for(j=0;j<onlineUsers.length;j++){
//             if(users[i] == onlineUsers[j].username){    //the same users
//                 newUser = onlineUsers[j]; 
//                 isNewUser = false;
//                 break;
//             }
//         }
//         if(isNewUser){
//             newUser={
//                 userid: 'user_'+users[i],
//                 username: users[i],
//                 unreadMessage: false
//             }
//         }
//         newOnlineUsers.push(newUser);
//     }

//     // updateView();
//     onlineUsers = newOnlineUsers;
//     updateView();
// };


// function chatPartnerExists(chatPartnerID, users){
//     var found = false;
//     users.forEach( user => {
//         if(chatPartnerID == user){
//             found = true;
//         }
//     });
//     return found;
// };

// // Select chat Partner
// function selectChatPartner(newPartnerID){

//     if(newPartnerID != 'broadcast_user'){
//         broadcasting = false;
//         $("#chat-partner-header").html('You are chating with <strong>'+$("#"+newPartnerID).attr('data-user')+'</strong>');
//     }else{
//         broadcasting = true;
//         $("#chat-partner-header").html('You are in <strong style="color:red;">BROADCAST</strong> mode');
//     }

//     if(chatPartnerID != null){
//         $("#"+chatPartnerID).removeClass('bg-success');
//     };
//     chatPartnerID = newPartnerID;
//     $("#"+chatPartnerID).addClass('bg-success');
// };

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
            state.setUserName(user);
            // state.setChatPartnerName('BROADCAST');  // a moze to zrobic defaultowo?
            // state.setChatPartnerID('broadcast_user');
        }
    });
});

// Typing a message
message.addEventListener('keypress', function(e){
    // console.log('typing')
    var username = state.getUserName();
    var partner = state.getChatPartnerName();
    var userid = state.getUserID();
    //don't emit nothing by empty message
    // if(e.keyCode != 13 && !e.ctrlKey){
        if(state.getBroadcasting()){
            // socket.emit('typing broadcast message',username);
            socket.emit('typing broadcast message', username);
        }else{
            socket.emit('typing send message', partner, username);
        }
    // }
});

// Sending Message
$sendBtn.on('click', function(){
    //don't send empty message
    if($message.val() != "\n" && $message.val() != ""){
        // console.log('send or broacdcast maddage');
        if(state.getBroadcasting()){
            socket.emit('broadcast message',$message.val());
        }else{
            var chatPartner = state.getChatPartnerName();
            socket.emit('send message', chatPartner, $message.val());
        } 
    }
    $message.val("");
});

// LISTEN FOR SOCKET EVENTS

// Update users list
socket.on('get users', function(users){
    // console.log(users);
    state.setOnlineUsers(users);
    // state.showState();
});

// Someone is typing to us
socket.on('typing', function(data){
    feedback.innerHTML = '<p><em>' + data + ' is typing a message </em></p>';
});

// Received a message
socket.on('new message', function(data){
    feedback.innerHTML = "";
    state.messageReceived(data);
    // console.log(data);
    // state.showState();
});