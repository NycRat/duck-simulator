const protocol = location.protocol.startsWith("https") ? "wss" : "ws";
const wsUri = `${protocol}://${location.hostname}:8000/ws`;

let socket = new WebSocket(wsUri);

socket.addEventListener("open", (_event) => {
  console.log("connected");
  document.getElementById("start").addEventListener("click", (ev) => {
    ev.preventDefault();
    socket.send("/start_game main");
    console.log("started game");
  });
});

socket.addEventListener("error", (_event) => {
  console.log("socket error");
});
