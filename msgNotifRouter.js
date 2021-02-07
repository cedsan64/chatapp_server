var io = null;
exports.initSocketIO = (http) =>{
    io = require("socket.io")(http, {
        cors: {
          origin: "http://localhost:3000",
          methods: ["GET", "POST"]
        }
      });
    io.on('connection', (socket) => {
        console.log(socket.handshake.auth.token);
        socket.on("sendMsg", (receiver,message) => {
            console.log(receiver, message); // world
          });
    
    
    });

}