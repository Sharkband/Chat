//connect to server and retain the socket
//connect to same host that served the document

//const socket = io('http://' + window.document.location.host)
let connected = false;
let username = '';
const socket = io() //by default connects to same server that served the page


socket.on('serverSays', function(message) {

  let msgDiv = document.createElement('div')
  let spanClass1 ='user'
  checkUsername = '';

  //checking the username if its the same then make it blue
  for(let i=0; i<message.length; i++){
    if(message.charAt(i)==':'){
      break;
    }else{
      checkUsername = checkUsername + message.charAt(i);
    }
  }


  if(checkUsername === username){
    message = `<span class=${spanClass1}>${message}</span>`
  }

  msgDiv.innerHTML = message
  
  document.getElementById('messages').appendChild(msgDiv)
})


socket.on('connectAs', function(connection, user) {

  //setting username
  let msgDiv = document.createElement('div')
  msgDiv.textContent = connection
  document.getElementById('messages').appendChild(msgDiv)
  connected = true;

  if(user != 'false'){
    username = user;
  }
  
  

  })

  socket.on('privateMessage', function(message) {

    //making the private message red
    let msgDiv = document.createElement('div')
    let spanClass2 ='private'
    message = `<span class=${spanClass2}>${message}</span>`
    msgDiv.innerHTML = message

    document.getElementById('messages').appendChild(msgDiv)
    
  
    })

//sends message if its a private one then it goes into private if its not then it goes to client says
function sendMessage() {
  let message = document.getElementById('msgBox').value.trim()

  if(message === '') return //do nothing
    if(message.includes(":")){
      message = username +': '+ message;
      socket.emit('privateMessage', message)
    }else if(connected == true){
      message = username +': '+ message;
  socket.emit('clientSays', message)
    }
  document.getElementById('msgBox').value = ''
}

//connects the user by emit a socket to the server for connectAs and checks if the username is correct
function connectUser() {
  let user= document.getElementById('username').value.trim()
  
    socket.emit('connectAs', user)
  
  document.getElementById('username').value = ''
}

//clears screen
function clearScreen() {
 
  document.getElementById('messages').innerHTML = ''
}

function handleKeyDown(event) {
  const ENTER_KEY = 13 //keycode for enter key
  if (event.keyCode === ENTER_KEY) {
    sendMessage()
    return false //don't propogate event
  }
}

//Add event listeners
document.addEventListener('DOMContentLoaded', function() {
  //This function is called after the browser has loaded the web page

  //add listener to buttons
  
  document.getElementById('send_button').addEventListener('click', sendMessage)
  
  document.getElementById('connect_button').addEventListener('click', connectUser)

  document.getElementById('clear_button').addEventListener('click', clearScreen)

  //add keyboard handler for the document as a whole, not separate elements.
  document.addEventListener('keydown', handleKeyDown)
  //document.addEventListener('keyup', handleKeyUp)
})
