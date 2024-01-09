/*
(c) 2023 Louis D. Nel
Based on:
https://socket.io
see in particular:
https://socket.io/docs/
https://socket.io/get-started/chat/

Before you run this app first execute
>npm install
to install npm modules dependencies listed in package.json file
Then launch this server:
>node server.js

To test open several browsers to: http://localhost:3000/chatClient.html

*/
const server = require('http').createServer(handler)
const io = require('socket.io')(server) //wrap server app in socket io capability
const fs = require('fs') //file system to server static files
const url = require('url'); //to parse url strings
const PORT = process.argv[2] || process.env.PORT || 3000 //useful if you want to specify port through environment variable
                                                         //or command-line arguments

const ROOT_DIR = 'html' //dir to serve static files from

const MIME_TYPES = {
  'css': 'text/css',
  'gif': 'image/gif',
  'htm': 'text/html',
  'html': 'text/html',
  'ico': 'image/x-icon',
  'jpeg': 'image/jpeg',
  'jpg': 'image/jpeg',
  'js': 'application/javascript',
  'json': 'application/json',
  'png': 'image/png',
  'svg': 'image/svg+xml',
  'txt': 'text/plain'
}

function get_mime(filename) {
  for (let ext in MIME_TYPES) {
    if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
      return MIME_TYPES[ext]
    }
  }
  return MIME_TYPES['txt']
}

server.listen(PORT) //start http server listening on PORT

function handler(request, response) {
  //handler for http server requests including static files
  let urlObj = url.parse(request.url, true, false)
  console.log('\n============================')
  console.log("PATHNAME: " + urlObj.pathname)
  console.log("REQUEST: " + ROOT_DIR + urlObj.pathname)
  console.log("METHOD: " + request.method)

  let filePath = ROOT_DIR + urlObj.pathname
  if (urlObj.pathname === '/') filePath = ROOT_DIR + '/index.html'

  fs.readFile(filePath, function(err, data) {
    if (err) {
      //report error to console
      console.log('ERROR: ' + JSON.stringify(err))
      //respond with not found 404 to client
      response.writeHead(404);
      response.end(JSON.stringify(err))
      return
    }
    response.writeHead(200, {
      'Content-Type': get_mime(filePath)
    })
    response.end(data)
  })

}

let users =[];
let privateUsers =[];



//Socket Server
io.on('connection', function(socket) {
  console.log('client connected')
  
  //console.dir(socket)

  //connection 
  socket.on('connectAs', function(user) {
    var firstLetter = user.charAt(0).toUpperCase();
    //checking if the username is just numbers and letters and the first char is a letter
    if((/^[A-Za-z0-9]*$/.test(user) === true) && (firstLetter.toLowerCase() != firstLetter)){
      //adding to the array and room
      users.push(user)
      socket.join(user)

      //sending back a message with the user and connection successful
      socket.emit('connectAs', 'Connection successful', user);
    }else{
      socket.emit('connectAs', 'Connection Unsuccessful', 'false');
    }

    })

  socket.on('clientSays', function(data) {
    console.log('RECEIVED: ' + data)
    //to broadcast message to everyone who connected including sender:

    for(let i=0; i<users.length; i++){
      io.sockets.in(users[i]).emit('serverSays', data);
    }
    
  })

  socket.on('privateMessage', function(data) {
    console.log('RECEIVED: ' + data)
    //to broadcast message to private people including sender:
    //getting the username and people who the username is messaging 
    let username ="";
    let privateUsername ="";
    let privateUsernames = [];
    let text ="";
    let count =0;
    for(let i=0; i<data.length; i++){
      if(data.charAt(i)==':'){
        count++;
      }else if(count == 1){
        privateUsername = privateUsername + data.charAt(i);
      }else if(count == 2){
        text = text + data.charAt(i);
      }else{
        username = username + data.charAt(i);
      }
    }

    //if it has a , then its multiple 
    //else its one private message 

    if(privateUsername.includes(',')){
      
      privateUsers.push(username.trim());
      socket.join(username+' ')
      privateUsernames = privateUsername.split(',');
      
      for(let i=0; i<privateUsernames.length; i++){
        socket.join(privateUsernames[i]+' ')
        privateUsers.push(privateUsernames[i].trim());  
      }

      for(let i=0; i<privateUsers.length; i++){
        io.sockets.in(privateUsers[i]).emit('privateMessage', (username+': '+text));
      }
      
      while(privateUsers.length > 0) {
        privateUsers.pop();
      }

      

    }else{

      privateUsers.push(username.trim());
      socket.join(username+' ')
      privateUsers.push(privateUsername.trim());
      socket.join(privateUsername+' ')

      for(let i=0; i<privateUsers.length; i++){
        io.sockets.in(privateUsers[i]).emit('privateMessage', (username+': '+text) );
      }
      
      while(privateUsers.length > 0) {
        privateUsers.pop();
      }
    }
 
  })

  socket.on('disconnect', function(data) {
    //event emitted when a client disconnects
    console.log('client disconnected')
  })
})

console.log(`Server Running at port ${PORT}  CNTL-C to quit`)
console.log(`To Test:`)
console.log(`Open several browsers to: http://localhost:${PORT}/chatClient.html`)
