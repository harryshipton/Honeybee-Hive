//Require the encryption modules
var RSA = require('../Utils/RSA.js');
var AES = require('../Utils/AES.js');
//Error handler
var Error = require('../Utils/Error.js');
//Export main function
module.exports = function(socket, serverPublicKey, callback) {
  //Generate a session key
  var sessionKey = AES.generateKey();
  //Encrypt it with the serverPublicKey
  var encrypted;
  //Attempt to encrypt, otherwise error to user
  try {
    encrypted = RSA.encrypt(serverPublicKey, JSON.stringify({key: sessionKey}));
  } catch {
    console.log('Error: SECURITY_ENCRYPTION_FAILURE');
    return;
  }
  //Listen only once
  socket.once('message', function(message) {
    if(Error.findError(message.error)) {
      //Error has occured
      console.log('Error: ' + Error.findError(message.error));
      return;
    }
    var payload = message.payload;
    var tag = message.tag;
    var iv = message.iv;
    //Try to decrypt
    var decrypted;
    try {
      decrypted = JSON.parse(AES.decrypt(sessionKey, iv, tag, payload))
    } catch {
      console.log('Error: SECURITY_DECRYPTION_FAILURE');
      return;
    }
    //Tag wasn't correct
    if(!decrypted) {
      console.log('Error: STAGE_HANDSHAKE_GENERIC');
      return;
    }
    //Encrypted text wasn't correct
    if(decrypted !== 'success') {
      console.log('Error: STAGE_HANDSHAKE_GENERIC');
      return;
    }
    //Callback to the caller with the sessionKey
    callback(sessionKey);
  });
  //Send a message
  socket.sendMessage({type: 'handshake', payload: encrypted})
}