const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let roomId = null;

document.getElementById("createBtn").onclick = () => {

  socket.emit("createRoom");

};

document.getElementById("joinBtn").onclick = () => {

  const code =
    document.getElementById("joinInput").value;

  socket.emit("joinRoom", code);

};

socket.on("roomCreated", (code) => {

  roomId = code;

  document.getElementById("roomCode").innerText =
    "ROOM CODE: " + code;

});

socket.on("errorMessage", (msg) => {

  alert(msg);

});

socket.on("gameState", (room) => {

  draw(room);

});

function draw(room) {

  ctx.clearRect(0, 0, 700, 400);

  ctx.fillStyle = "white";

  ctx.fillRect(20, room.leftY, 12, 80);

  ctx.fillRect(668, room.rightY, 12, 80);

  ctx.fillRect(room.ball.x, room.ball.y, 12, 12);

}