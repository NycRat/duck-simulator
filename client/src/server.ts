import Game from "./game";
import Duck from "./duck";

export default function serverConnect(game: Game) {
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

    setInterval(() => {
      if (socket) {
        socket.send(
          `/update ${game.ducks[0].position.x.toFixed(10)} ${game.ducks[0].position.z.toFixed(10)}`,
        );
      }
    }, 10);
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
      } else if (data[0] === "/updatesync") {
        for (let i = 1; i < data.length; i++) {
          const info = data[i].split(" ");
          const id = info[0];
          const x = parseFloat(info[1]);
          const z = parseFloat(info[2]);

          // REFACTOR TO OPTIMIZE LATER O(n), CURRENTLY O(n^2)
          if (id === game.ducks[0].idd) {
            continue;
          }
          for (const duck of game.ducks) {
            if (id === duck.idd) {
              duck.position.x = x;
              duck.position.z = z;
              break;
            }
          }
        }
      } else if (data[0] === "/id") {
        game.ducks[0].idd = data[1];
      } else if (data[0] === "/join") {
        for (let i = 1; i < data.length; i++) {
          game.ducks.push(new Duck());
          game.ducks[game.ducks.length - 1].idd = data[i];
          game.scene.add(game.ducks[game.ducks.length - 1]);
        }
      } else {
        console.log("Message from server ", event.data);
      }
    } else {
      console.log("Message from server ", event.data);
    }
  });
  socket.addEventListener("close", () => {
    if (!socket) {
      return;
    }
    socket = null;
  });
}
