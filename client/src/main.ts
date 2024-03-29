import WebGL from "three/addons/capabilities/WebGL.js";
import Game from "./game";

function main() {
  if (!WebGL.isWebGLAvailable()) {
    const warning = WebGL.getWebGLErrorMessage();
    document.getElementById("warning")?.appendChild(warning);
    return;
  }

  window.oncontextmenu = () => {
    return false;
  };

  const game = new Game();
  game.update(game);
}

function serverTest() {
  var socket: WebSocket | null = null;

  const proto = location.protocol.startsWith("https") ? "wss" : "ws";
  // const wsUri = `${proto}://${location.host}/ws`;
  const wsUri = `${proto}://127.0.0.1:8000/ws`;

  socket = new WebSocket(wsUri);

  socket.addEventListener("open", (_event) => {
    if (!socket) {
      return;
    }
    socket.send("Hello Server!");
    socket.send("/list");
  });
  socket.addEventListener("message", (event: MessageEvent<string>) => {
    if (!socket) {
      return;
    }

    if (event.data[0] === "/") {
      // RESPONSE FROM COMMAND
      const data = event.data.split("\n");
      if (data[0] === "/list") {
        // from list lobby
        var lobbies = "";
        for (let i = 1; i < data.length; i++) {
          lobbies += data[i] + ", ";
        }
        console.log("Lobbies: " + lobbies);
      } else if (data[0] === "/update") {
        console.log("update: ", data[1]);
      } else {
        console.log("Message from server ", event.data);
      }
    }
  });
  socket.addEventListener("close", () => {
    if (!socket) {
      return;
    }
    socket = null;
  });
}

main();

serverTest();
