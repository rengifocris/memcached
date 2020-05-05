const net = require("net");
const arg = require("arg");
const MemoryCached = require("./src/index");
const shortid = require('shortid');

const parseArgumentsIntoOptions = (rawArgs) => {
  const args = arg({
      '--port': Number,
      '--help': Boolean,
      '-p': '--port',
      '-h': '--help',
  },
      {
          argv: rawArgs.slice(2),
      }
  );
  return {
      port: args['--port'] || 11211,
      help: args['--help'] || false
  };
}

export function cli(args) {

  let options = parseArgumentsIntoOptions(args);

  // Create and return a net.Server object, the function will be invoked when client connect to this server.

  let server = net.createServer(function (client) {
    console.log(
      "Client connect. Client local address : " +
        client.localAddress +
        ":" +
        client.localPort +
        ". client remote address : " +
        client.remoteAddress +
        ":" +
        client.remotePort
    );
    
    client.setEncoding("utf-8");

    let user_state = "reading_header";
    let buffer = "";
    let header = "";
    let body = "";
    let expectBodyLen = 0;
    let CRLF_LEN = 2;
  
    // When receive client data.
    client.on("data", function (data) {
      // Print received client data and length.
      console.log(
        "Receive client send data : " + data + ", data size : " + client.bytesRead
      );
  
      // Server send data back to client use client net.client object.
      buffer += data;
  
      // we may got some data to handle
      client.emit("user_event");
    });
  
    // When user_event is listened
    client.on("user_event", function () {
      switch (user_state) {
        case "reading_header": //if we are reading header
          let pos = -1;
          if ((pos = buffer.indexOf("\r\n")) != -1) {
            header = buffer.slice(0, pos);
            buffer = buffer.slice(pos + 2);
            CRLF_LEN = 2;
          } else if ((pos = buffer.indexOf("\n")) != -1) {
            header = buffer.slice(0, pos);
            buffer = buffer.slice(pos + 1);
            CRLF_LEN = 1;
          }
          if (pos != -1) {
            user_state = "reading_body";
            expectBodyLen = handleHeader(header, CRLF_LEN);
            client.emit("user_event");
          }
          break;
        case "reading_body": // if we are reading body
          if (expectBodyLen <= buffer.length) {
            body = buffer.slice(0, expectBodyLen - CRLF_LEN);
            buffer = buffer.slice(expectBodyLen);
            user_state = "reading_header";
            // adds id to the client
            client.id = client.localAddress + ":" + client.localPort;
            console.log("client ID =>",client.id);
            handleBody(client, header, body, function () {
              if (buffer.length > 0) {
                client.emit("user_event");
              }
            });
          }
          break;
      }
    });
  
    // When client send data complete.
    client.on("end", function () {
      console.log("Client disconnect.");
      // Get current connections count.
      server.getConnections(function (err, count) {
        if (!err) {
          // Print current connection count in server console.
          console.log("There are %d connections now. ", count);
        } else {
          console.error(JSON.stringify(err));
        }
      });
    });
  
    // When client timeout.
    client.on("timeout", function () {
      console.log("Client request time out. ");
    });
  });
  
  // Make the server a TCP server listening on port 9999.
  serverListening(server, options.port);
}

function serverListening(server, port) {
  console.log(`port: ${port}`);
  server.listen(port, function () {
    // Get server address info.
    let serverInfo = server.address();
    let serverInfoJson = JSON.stringify(serverInfo);
    console.log("TCP server listen on address : " + serverInfoJson);
    server.on("close", function () {
      console.log("TCP server socket is closed.");
    });
    server.on("error", function (error) {
      console.error(JSON.stringify(error));
    });
  });
}

function handleHeader(header, crlf_len) {
  let tup = header.split(" ");
  let expect_body_len = 0;
  switch (tup[0]) {
    case "get":
    case "gets":
    case "delete":
      expect_body_len = 0;
      break;
    case "set":
      expect_body_len = parseInt(tup[4]) + crlf_len;
      break;
    case "add":
      expect_body_len = parseInt(tup[4]) + crlf_len;
      break;
    case "replace":
      expect_body_len = parseInt(tup[4]) + crlf_len;
      break;
    case "replace":
      expect_body_len = parseInt(tup[4]) + crlf_len;
      break;
    case "append":
      expect_body_len = parseInt(tup[4]) + crlf_len;
      break;
    case "prepend":
      expect_body_len = parseInt(tup[4]) + crlf_len;
      break;
    case "cas":
      expect_body_len = parseInt(tup[4]) + crlf_len;
      break;
  }
  return expect_body_len;
}

function handleBody(socket, header, body, call_back) {
  let response = "";
  let tup = header.split(" ");
  let key = "";
  let flag = "";
  let id = null;
  let lifeTime = null;
  switch (tup[0]) {
    case "get":
      key = tup[1];
      var obj = MemoryCached.get(key);
      if (obj) {
        response = `VALUE ${key} ${obj.flag} ${obj.length} \r\n`;
        response += `${obj.data}\r\n`;
        response += `END\r\n`;
      } else {
        response = `NOT_FOUND\r\n`;
      }
      break;
    case "gets":
      key = tup[1];
      var obj = MemoryCached.gets(key);
      if (obj) {
        response = `VALUE ${key} ${obj.flag} ${obj.data.length} \r\n`;
        response += `CasValue ${obj.cas}/${obj.data}\r\n`;
        response += `END\r\n`;
      } else {
        response = `NOT_FOUND\r\n`;
      }
      break;
    case "delete":
      key = tup[1];
      MemoryCached.del(key);
      response = "DELETED\r\n";
      break;
    case "set":
      key = tup[1];
      flag = tup[2];
      lifeTime = tup[3];

      try {
        MemoryCached.set(key, body, lifeTime, flag);
        response = `STORED\r\n`;
      } catch (error) {
        response = `ERROR\r\n`;
      }

      break;
    case "add":
      key = tup[1];
      flag = tup[2];
      lifeTime = tup[3];

      try {
        MemoryCached.add(key, body, lifeTime, flag);
        response = `STORED\r\n`;
      } catch (error) {
        response = `NOT_STORED\r\n`;
      }
      break;
    case "replace":
      key = tup[1];
      flag = tup[2];
      lifeTime = tup[3];

      try {
        MemoryCached.replace(key, body, lifeTime, flag);
        response = `STORED\r\n`;
      } catch (error) {
        response = `NOT_STORED\r\n`;
      }
      break;
    case "append":
      key = tup[1];
      flag = tup[2];
      lifeTime = tup[3];

      try {
        MemoryCached.append(key, body, lifeTime, flag);
        response = `STORED\r\n`;
      } catch (error) {
        response = `NOT_STORED\r\n`;
      }
      break;
    case "prepend":
      key = tup[1];
      flag = tup[2];
      lifeTime = tup[3];

      try {
        MemoryCached.prepend(key, body, lifeTime, flag);
        response = `STORED\r\n`;
      } catch (error) {
        response = `NOT_STORED\r\n`;
      }
      break;
    case "cas":
      key = tup[1];
      flag = tup[2];
      lifeTime = tup[3];
      lifeTime = tup[3];
      id = tup[5];
      cliendId = socket.id;
      try {
        MemoryCached.cas(key, body, lifeTime, flag, id, cliendId);
        response = `STORED\r\n`;
      } catch (error) {
        response = `EXISTS\r\n`;
      }
      break;
    default:
      response = "ERROR\r\n";
      break;
  }
  socket.write(response, "binary", call_back);
}
