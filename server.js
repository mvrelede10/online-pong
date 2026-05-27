const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let rooms = {};

function createBall() {
  return {
    x: 350,
    y: 200,
    dx: Math.random() > 0.5 ? 5 : -5,
    dy: Math.random() * 4 - 2
  };
}

function createRoom(roomId) {
  rooms[roomId] = {
    players: [],
    leftY: 160,
    rightY: 160,
    score1: 0,
    score2: 0,
    ball: createBall()
  };
}

function updateGame(roomId) {

  const room = rooms[roomId];

  if (!room) return;

  const ball = room.ball;

  ball.x += ball.dx;
  ball.y += ball.dy;

  // Верх и низ
  if (ball.y <= 0 || ball.y >= 388) {
    ball.dy *= -1;
  }

  // Левая ракетка
  if (
    ball.x <= 32 &&
    ball.y + 12 >= room.leftY &&
    ball.y <= room.leftY + 80
  ) {
    ball.dx = Math.abs(ball.dx);
  }

  // Правая ракетка
  if (
    ball.x + 12 >= 668 &&
    ball.y + 12 >= room.rightY &&
    ball.y <= room.rightY + 80
  ) {
    ball.dx = -Math.abs(ball.dx);
  }

  // Гол
  if (ball.x < 0) {
    room.score2++;
    room.ball = createBall();
  }

  // Гол
  if (ball.x > 700) {
    room.score1++;
    room.ball = createBall();
  }

  io.to(roomId).emit('gameState', room);
}

setInterval(() => {
  Object.keys(rooms).forEach(updateGame);
}, 1000 / 60);

io.on('connection', (socket) => {

  console.log('Player connected:', socket.id);

  socket.on('createRoom', () => {

    const roomId = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    createRoom(roomId);

    rooms[roomId].players.push(socket.id);

    socket.join(roomId);

    socket.emit('roomCreated', roomId);

  });

  socket.on('joinRoom', (roomId) => {

    roomId = roomId.toUpperCase();

    if (!rooms[roomId]) {
      socket.emit('errorMessage', 'Room not found');
      return;
    }

    if (rooms[roomId].players.length >= 2) {
      socket.emit('errorMessage', 'Room is full');
      return;
    }

    rooms[roomId].players.push(socket.id);

    socket.join(roomId);

    io.to(roomId).emit('gameStarted');

  });

  socket.on('moveLeft', (y, roomId) => {

    if (!rooms[roomId]) return;

    rooms[roomId].leftY = y;

  });

  socket.on('moveRight', (y, roomId) => {

    if (!rooms[roomId]) return;

    rooms[roomId].rightY = y;

  });

  socket.on('disconnect', () => {

    console.log('Player disconnected');

  });

});

server.listen(PORT, () => {

  console.log('Server started on port ' + PORT);

});