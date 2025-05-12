// socket.js
let io;

module.exports = {
  init: (server) => {
    io = require('socket.io')(server, {
      cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      console.log('New user connected:', socket.id);

      socket.on('send_message', (message) => {
        console.log('Message received:', message);
        socket.broadcast.emit('receive_message', message);
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};
