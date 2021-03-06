'use strict';
//Require net for JsonSocket
let net = require('net');
//Require json-socket
let JsonSocket = require('json-socket');
//Require node-persist
let storage = require('node-persist');

//Sections
let register = require('./Register.js');
let request = require('./Request.js');
let submit = require('./Submit.js');

let main = function(address, port, serverPublicKey, eventHandler,
  clientPrivateKey, clientID, strength) {
  //Register for alerts
  eventHandler.on('request', function(callback) {
    //Create socket
    let socket = new JsonSocket(new net.Socket());
    //Connect to server
    socket.connect(port, address);
    //Wait until we are connected
    socket.on('connect', function() {
      request(socket, eventHandler, serverPublicKey,
        clientPrivateKey, clientID, strength, callback);
    });
  });
  eventHandler.on('submit', function(data, callback) {
    //Create socket
    let socket = new JsonSocket(new net.Socket());
    //Connect to server
    socket.connect(port, address);
    //Wait until we are connected
    socket.on('connect', function() {
      submit(socket, eventHandler, serverPublicKey,
        clientPrivateKey, clientID, strength, data, callback);
    });
  });
  //Alert client that we have registered and are ready for work
  eventHandler.registered();
};
//Export the main function
module.exports = function(eventHandler, settings) {
  //Load the storage
  storage.initSync();
  //Load private key
  let clientPrivateKey = storage.getItem('key');
  //If not registered
  if(clientPrivateKey == null) {
    //Create socket
    let socket = new JsonSocket(new net.Socket());
    //Connect to server
    socket.connect(settings.connection.port, settings.connection.hostname);
    //Wait for connection
    socket.on('connect', function() {
      //Call register function
      register(socket, eventHandler, storage, settings.encryption.key,
          settings.proofOfWork.strength,
          function(error, clientPrivateKey, clientID) {
        //If error, halt - the user failed to register at startup for some
        //reason
        if(error) {
          console.log(error.toString());
          return;
        }
        //Once finished, get the private key and clientID call the main function
        main(settings.connection.hostname, settings.connection.port,
          settings.encryption.key, eventHandler, clientPrivateKey, clientID,
          settings.proofOfWork.strength);
      });
    });
    //Stop execution (main is called once connected)
    return;
  }
  let clientID = storage.getItem('id');
  main(settings.connection.hostname, settings.connection.port,
    settings.encryption.key, eventHandler, clientPrivateKey, clientID);
};
