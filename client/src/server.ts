import Game from "./game";
import Duck from "./duck";
import Protos from "../protos_pb";
import Bread from "./bread";

export default function serverConnect(game: Game) {
  var socket: WebSocket | null = null;

  const protocol = location.protocol.startsWith("https") ? "wss" : "ws";
  const wsUri = `${protocol}://${location.hostname}:8000/ws`;
  // const wsUri = `${protocol}://127.0.0.1:8000/ws`;

  socket = new WebSocket(wsUri);

  socket.addEventListener("open", (_event) => {
    if (!socket) {
      return;
    }
    socket.send("Hello Server!");
    socket.send("/list");

    setInterval(() => {
      if (socket) {
        const duckState = new Protos.Duck();
        duckState.setId(game.ducks[0].idd);
        duckState.setX(game.ducks[0].position.x);
        duckState.setZ(game.ducks[0].position.z);
        duckState.setRotation(game.ducks[0].rotation.y);

        socket.send(duckState.serializeBinary());
      }
    }, 10);
  });
  socket.addEventListener("message", (event: MessageEvent<string>) => {
    if (typeof event.data !== "string") {
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
      } else if (data[0] === "/disconnect") {
        console.log(data);
        for (let i = 0; i < game.ducks.length; i++) {
          if (game.ducks[i].idd === data[1]) {
            game.scene.remove(game.ducks[i]);
            game.ducks.splice(i);
            break;
          }
        }
      } else if (data[0] === "/id") {
        game.ducks[0].idd = data[1];
      } else if (data[0] === "/join") {
        console.log(data);
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

  socket.addEventListener("message", async (event: MessageEvent<Blob>) => {
    if (typeof event.data === "string") {
      return;
    }
    const data = Protos.UpdateSync.deserializeBinary(
      new Uint8Array(await event.data.arrayBuffer()),
    );

    // const serverTime = data.getTs();
    // const deltaTime = new Date().getTime() - serverTime;

    if (data.getBreadX() && data.getBreadY() && data.getBreadZ()) {
      game.breadList.push(
        new Bread(data.getBreadX(), data.getBreadY(), data.getBreadZ()),
      );
      game.scene.add(game.breadList[game.breadList.length - 1]);
      console.log("BREAD");
    }

    const ducks = data.getDucksList();
    for (let i = 0; i < ducks.length; i++) {
      const id = ducks[i].getId().toString();
      const x = ducks[i].getX();
      const z = ducks[i].getZ();
      const rotation = ducks[i].getRotation();

      if (id === game.ducks[0].idd) {
        continue;
      }
      for (const duck of game.ducks) {
        if (id === duck.idd) {
          duck.position.x = x;
          duck.position.z = z;
          duck.rotation.y = rotation;
          duck.direction = rotation;
          break;
        }
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
