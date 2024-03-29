//! `ChatServer` is an actor. It maintains list of connection client session.
//! And manages available lobbies. Peers send messages to other peers in same
//! lobby through `ChatServer`.

use crate::state;
use std::{
    collections::{HashMap, HashSet},
    sync::{
        atomic::{AtomicUsize, Ordering},
        Arc,
    },
};

use actix::prelude::*;
use rand::{rngs::ThreadRng, Rng};

/// Chat server sends this messages to session
#[derive(Message)]
#[rtype(result = "()")]
pub struct Message(pub String);

/// Message for chat server communications

/// New chat session is created
#[derive(Message)]
#[rtype(usize)]
pub struct Connect {
    pub addr: Recipient<Message>,
}

/// Session is disconnected
#[derive(Message)]
#[rtype(result = "()")]
pub struct Disconnect {
    pub id: usize,
}

/// Send message to specific lobby
#[derive(Message)]
#[rtype(result = "()")]
pub struct ClientMessage {
    /// Id of the client session
    pub id: usize,
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
    pub id: usize,

    /// lobby name
    pub name: String,
}

#[derive(Message)]
#[rtype(result = "Vec<state::State>")]
pub struct Update {
    pub lobby_name: String,
}

/// `ChatServer` manages chat lobbies and responsible for coordinating chat session.
///
/// Implementation is very naïve.
#[derive(Debug)]
pub struct GameServer {
    clients: HashMap<usize, Recipient<Message>>,
    lobbies: HashMap<String, HashSet<usize>>,
    rng: ThreadRng,
    visitor_count: Arc<AtomicUsize>,
}

impl GameServer {
    pub fn new(visitor_count: Arc<AtomicUsize>) -> GameServer {
        // default lobby
        let mut lobbies = HashMap::new();
        lobbies.insert("main".to_owned(), HashSet::new());
        lobbies.insert("other lobby".to_owned(), HashSet::new());

        GameServer {
            clients: HashMap::new(),
            lobbies,
            rng: rand::thread_rng(),
            visitor_count,
        }
    }
}

impl GameServer {
    /// Send message to all users in the lobby
    fn send_message(&self, lobby: &str, message: &str, skip_id: usize) {
        if let Some(sessions) = self.lobbies.get(lobby) {
            for id in sessions {
                if *id != skip_id {
                    if let Some(addr) = self.clients.get(id) {
                        addr.do_send(Message(message.to_owned()));
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
}

/// Handler for Connect message.
///
/// Register new session and assign unique id to this session
impl Handler<Connect> for GameServer {
    type Result = usize;

    fn handle(&mut self, msg: Connect, _: &mut Context<Self>) -> Self::Result {
        // register session with random id
        let id = self.rng.gen::<usize>();
        self.clients.insert(id, msg.addr);

        // auto join session to main lobby
        self.lobbies
            .entry("main".to_owned())
            .or_default()
            .insert(id);

        // notify all users in same lobby
        self.send_message("main", &format!("{id} joined"), id);

        let count = self.visitor_count.fetch_add(1, Ordering::SeqCst);
        self.send_message("main", &format!("Total visitors {count}"), 0);

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
        if self.clients.remove(&msg.id).is_some() {
            // remove session from all lobbies
            for (name, sessions) in &mut self.lobbies {
                if sessions.remove(&msg.id) {
                    lobbies.push(name.to_owned());
                }
            }
        }
        // send message to other users
        for lobby in lobbies {
            self.send_message(&lobby, "Someone disconnected", 0);
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

// TODO
impl Handler<Update> for GameServer {
    type Result = MessageResult<Update>;

    fn handle(&mut self, msg: Update, _: &mut Self::Context) -> Self::Result {
        match self.lobbies.get(&msg.lobby_name) {
            Some(lobby) => {
                // lobby.iter().map(|id| {
                // self.clients.get(id).unwrap().
                // })
                // MessageResult(lobby.len() as i32)
            }
            None => MessageResult(vec![]),
        }
    }
}
