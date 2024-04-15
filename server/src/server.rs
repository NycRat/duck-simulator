use crate::protos::generated_with_pure::update_sync::UpdateProto;
use crate::protos::generated_with_pure::update_sync::UpdateSyncProto;
use crate::state::{self, State};
use protobuf::Message as OtherMessage;
use std::{
    collections::{HashMap, HashSet},
    time::Duration,
};

const UPDATE_SYNC_INTERVAL: Duration = Duration::from_millis(10);

use actix::prelude::*;
use rand::{rngs::ThreadRng, Rng};

#[derive(Message)]
#[rtype(result = "()")]
pub struct MessageWoah(pub Option<String>, pub Option<Vec<u8>>);

/// New chat session is created
#[derive(Message)]
#[rtype(u32)]
pub struct Connect {
    pub addr: Recipient<MessageWoah>,
}

/// Session is disconnected
#[derive(Message)]
#[rtype(result = "()")]
pub struct Disconnect {
    pub id: u32,
}

/// Send message to specific lobby
#[derive(Message)]
#[rtype(result = "()")]
pub struct ClientMessage {
    /// Id of the client session
    pub id: u32,
    /// Peer message
    pub msg: String,
    /// lobby name
    pub lobby: String,
}

/// List of available lobbies
pub struct ListLobbies;

impl actix::Message for ListLobbies {
    type Result = Vec<String>;
}

/// Join lobby, if lobby does not exists create new one.
#[derive(Message)]
#[rtype(result = "()")]
pub struct Join {
    /// Client ID
    pub id: u32,

    /// lobby name
    pub name: String,
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct Update {
    pub id: u32,
    pub state: state::State,
}

/// `ChatServer` manages chat lobbies and responsible for coordinating chat session.
///
/// Implementation is very naïve.
#[derive(Debug)]
pub struct GameServer {
    clients: HashMap<u32, Recipient<MessageWoah>>,
    states: HashMap<u32, state::State>,
    lobbies: HashMap<String, HashSet<u32>>,
    rng: ThreadRng,
}

impl GameServer {
    pub fn new() -> GameServer {
        // default lobby
        let mut lobbies = HashMap::new();
        lobbies.insert("main".to_owned(), HashSet::new());
        lobbies.insert("other lobby".to_owned(), HashSet::new());

        GameServer {
            clients: HashMap::new(),
            lobbies,
            rng: rand::thread_rng(),
            states: HashMap::new(),
        }
    }

    fn update_sync(&mut self, ctx: &mut Context<Self>) {
        ctx.run_interval(UPDATE_SYNC_INTERVAL, |act, _ctx| {
            for (lobby, _) in &act.lobbies {
                let mut out_msg = UpdateSyncProto::new();
                out_msg.ducks = act
                    .states
                    .iter()
                    .map(|(id, state)| {
                        let mut a = UpdateProto::new();
                        a.id = *id;
                        a.x = state.x;
                        a.z = state.z;
                        a.rotation = state.rotation;
                        a
                    })
                    .collect();

                // println!("BINARY: {:?}", out_msg.write_to_bytes().unwrap().size());
                act.send_message_binary(lobby, out_msg.write_to_bytes().unwrap(), 0);
            }
        });
    }

    /// Send message to all users in the lobby
    fn send_message(&self, lobby: &str, message: &str, skip_id: u32) {
        if let Some(sessions) = self.lobbies.get(lobby) {
            for id in sessions {
                if *id != skip_id {
                    if let Some(addr) = self.clients.get(id) {
                        addr.do_send(MessageWoah(Some(message.to_owned()), None));
                    }
                }
            }
        }
    }

    fn send_message_binary(&self, lobby: &str, message: Vec<u8>, skip_id: u32) {
        if let Some(sessions) = self.lobbies.get(lobby) {
            for id in sessions {
                if *id != skip_id {
                    if let Some(addr) = self.clients.get(id) {
                        addr.do_send(MessageWoah(None, Some(message.clone())));
                    }
                }
            }
        }
    }
}

/// Make actor from `ChatServer`
impl Actor for GameServer {
    /// We are going to use simple Context, we just need ability to communicate
    /// with other actors.
    type Context = Context<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        self.update_sync(ctx);
    }
}

/// Handler for Connect message.
///
/// Register new session and assign unique id to this session
impl Handler<Connect> for GameServer {
    type Result = u32;

    fn handle(&mut self, msg: Connect, _: &mut Context<Self>) -> Self::Result {
        // register session with random id
        let id = self.rng.gen::<u32>();

        msg.addr
            .do_send(MessageWoah(Some(format!("/id\n{id}").to_owned()), None));

        {
            // JOIN EVERYONE ELSE
            let other_ids: String = self
                .lobbies
                .get("main")
                .unwrap_or(&HashSet::new())
                .iter()
                .map(|x| format!("\n{x}"))
                .collect();

            msg.addr.do_send(MessageWoah(
                Some(format!("/join{other_ids}").to_owned()),
                None,
            ));
        }

        self.clients.insert(id, msg.addr);
        self.states.insert(
            id,
            State {
                x: 0.0,
                z: 0.0,
                rotation: 0.0,
            },
        );

        // auto join session to main lobby
        self.lobbies
            .entry("main".to_owned())
            .or_default()
            .insert(id);

        // notify all users in same lobby
        self.send_message("main", &format!("/join\n{id}"), id);

        // send id back
        id
    }
}

/// Handler for Disconnect message.
impl Handler<Disconnect> for GameServer {
    type Result = ();

    fn handle(&mut self, msg: Disconnect, _: &mut Context<Self>) {
        println!("Someone disconnected");

        let mut lobbies: Vec<String> = Vec::new();

        // remove address
        if self.clients.remove(&msg.id).is_some() && self.states.remove(&msg.id).is_some() {
            // remove session from all lobbies
            for (name, clients) in &mut self.lobbies {
                if clients.remove(&msg.id) {
                    lobbies.push(name.to_owned());
                }
            }
        }

        // send message to other users
        for lobby in lobbies {
            self.send_message(&lobby, &format!("/disconnect\n{}", msg.id), 0);
        }
    }
}

/// Handler for Message message.
impl Handler<ClientMessage> for GameServer {
    type Result = ();

    fn handle(&mut self, msg: ClientMessage, _: &mut Context<Self>) {
        self.send_message(&msg.lobby, msg.msg.as_str(), msg.id);
    }
}

/// Handler for `Listlobbies` message.
impl Handler<ListLobbies> for GameServer {
    type Result = MessageResult<ListLobbies>;

    fn handle(&mut self, _: ListLobbies, _: &mut Context<Self>) -> Self::Result {
        let lobbies = self.lobbies.keys().map(|lobby| lobby.to_owned()).collect();

        MessageResult(lobbies)
    }
}

/// Join lobby, send disconnect message to old lobby
/// send join message to new lobby
impl Handler<Join> for GameServer {
    type Result = ();

    fn handle(&mut self, msg: Join, _: &mut Context<Self>) {
        let Join { id, name } = msg;
        let mut lobbies = Vec::new();

        // remove session from all lobbies
        for (n, sessions) in &mut self.lobbies {
            if sessions.remove(&id) {
                lobbies.push(n.to_owned());
            }
        }
        // send message to other users
        for lobby in lobbies {
            self.send_message(&lobby, "Someone disconnected", 0);
        }

        self.lobbies.entry(name.clone()).or_default().insert(id);

        self.send_message(&name, "Someone connected", id);
    }
}

impl Handler<Update> for GameServer {
    type Result = MessageResult<Update>;

    fn handle(&mut self, msg: Update, _: &mut Self::Context) -> Self::Result {
        match self.states.get_mut(&msg.id) {
            Some(state) => {
                *state = msg.state;
            }
            None => {}
        }
        MessageResult(())
    }
}
