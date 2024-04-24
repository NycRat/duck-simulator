use crate::duck::Duck;
use crate::lobby;
use crate::protos::protos::protos;
use actix_web::body::MessageBody;
use protobuf::Message as OtherMessage;
use std::{collections::HashMap, time::Duration};

const UPDATE_SYNC_INTERVAL: Duration = Duration::from_millis(10);
const BREAD_PER_SECOND: f32 = 3.0;
const MAX_BREAD: usize = 500;
const GAME_DURATION: Duration = Duration::from_secs(120);

use actix::prelude::*;
use rand::{rngs::ThreadRng, Rng};

#[derive(Message)]
#[rtype(result = "()")]
pub struct MessageWoah(pub Option<String>, pub Option<Vec<u8>>);

#[derive(Message)]
#[rtype(u32)]
pub struct Connect {
    pub addr: Recipient<MessageWoah>,
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct Disconnect {
    pub id: u32,
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct ClientMessage {
    pub id: u32,
    pub msg: String,
    pub lobby: String,
}

pub struct ListLobbies;

impl actix::Message for ListLobbies {
    type Result = Vec<String>;
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct Join {
    pub id: u32,
    pub name: String,
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct Update {
    pub id: u32,
    pub duck: Duck,
}

#[derive(Debug)]
pub struct GameServer {
    clients: HashMap<u32, Recipient<MessageWoah>>,
    ducks: HashMap<u32, Duck>,
    lobbies: HashMap<String, lobby::Lobby>,
    rng: ThreadRng,
}

impl GameServer {
    pub fn new() -> GameServer {
        // default lobby
        let mut lobbies = HashMap::new();
        lobbies.insert("main".to_owned(), lobby::Lobby::new());
        lobbies.insert("main2".to_owned(), lobby::Lobby::new());

        GameServer {
            clients: HashMap::new(),
            lobbies,
            rng: rand::thread_rng(),
            ducks: HashMap::new(),
        }
    }

    fn update_sync(&mut self, ctx: &mut Context<Self>) {
        ctx.run_interval(UPDATE_SYNC_INTERVAL, |act, _ctx| {
            let lobbies: Vec<String> = act.lobbies.keys().map(|x| x.to_owned()).collect();

            for lobby_name in &lobbies {
                if let Some(lobby) = act.lobbies.get_mut(lobby_name) {
                    let delta_time = lobby.now.elapsed().as_secs_f32();
                    lobby.now = std::time::Instant::now();

                    // UPDATE BREAD
                    for (_, y, _) in &mut lobby.bread {
                        let gravity = -5.0;
                        // sqrt(v^2 - 2as) = u
                        let velocity = -f32::sqrt(f32::abs(2.0 * gravity * (10.0 - *y)));
                        *y += velocity * delta_time + 0.5 * gravity * delta_time.powi(2);
                        *y = y.max(0.1);
                    }

                    // INTERSECTIONS
                    for id in &lobby.duck_ids {
                        let duck = act.ducks.get_mut(id).unwrap();
                        let duck_pos = &(duck.x, duck.y, duck.z);

                        let duck_size = &(0.5, 0.5, 0.5);
                        let bread_size = &(0.2, 0.2, 0.2);

                        let mut i = 0;
                        while i < lobby.bread.len() {
                            let bread_pos = lobby.bread.get(i).unwrap();

                            type Vec3 = (f32, f32, f32);
                            fn intersect(a: &Vec3, b: &Vec3, a_size: &Vec3, b_size: &Vec3) -> bool {
                                return a.0 - a_size.0 <= b.0 + b_size.0
                                    && a.0 + a_size.0 >= b.0 - b_size.0
                                    && a.1 - a_size.1 <= b.1 + b_size.1
                                    && a.1 + a_size.1 >= b.1 - b_size.1
                                    && a.2 - a_size.2 <= b.2 + b_size.2
                                    && a.2 + a_size.2 >= b.2 - b_size.2;
                            }

                            if intersect(duck_pos, bread_pos, duck_size, bread_size) {
                                lobby.bread.swap_remove(i);
                                duck.score += 1;
                            } else {
                                i += 1;
                            }
                        }

                        // UPDATE DUCKS
                        // let delta_x = f32::sin(duck.rotation) * 3.0;
                        // let delta_z = f32::cos(duck.rotation) * 3.0;
                        // duck.x += delta_x * delta_time;
                        // duck.z += delta_z * delta_time;
                    }

                    let mut out_msg = protos::UpdateSync::new();
                    out_msg.ducks = act
                        .ducks
                        .iter()
                        .map(|(id, state)| {
                            let mut duck = protos::Duck::new();
                            duck.id = *id;
                            duck.x = state.x;
                            duck.y = state.y;
                            duck.z = state.z;
                            duck.rotation = state.rotation;
                            duck.score = state.score;
                            duck
                        })
                        .collect();

                    if act.rng.gen_range(0.0..=1.0)
                        <= (BREAD_PER_SECOND * UPDATE_SYNC_INTERVAL.as_secs_f32())
                        && lobby.bread.len() < MAX_BREAD
                    {
                        let x = act.rng.gen_range(-5.0..5.0);
                        let y = 10.0;
                        let z = act.rng.gen_range(-5.0..5.0);

                        out_msg.bread_x = Some(x);
                        out_msg.bread_y = Some(y);
                        out_msg.bread_z = Some(z);

                        lobby.bread.push((x, y, z));
                    }

                    println!("BINARY: {:?}", out_msg.write_to_bytes().unwrap().size());
                    act.send_message_binary(lobby_name, out_msg.write_to_bytes().unwrap(), 0);
                }
            }
        });
    }

    fn send_message(&self, lobby: &str, message: &str, skip_id: u32) {
        if let Some(lobby) = self.lobbies.get(lobby) {
            for id in &lobby.duck_ids {
                if *id != skip_id {
                    if let Some(addr) = self.clients.get(&id) {
                        addr.do_send(MessageWoah(Some(message.to_owned()), None));
                    }
                }
            }
        }
    }

    fn send_message_binary(&self, lobby: &str, message: Vec<u8>, skip_id: u32) {
        if let Some(lobby) = self.lobbies.get(lobby) {
            for id in &lobby.duck_ids {
                if *id != skip_id {
                    if let Some(addr) = self.clients.get(&id) {
                        addr.do_send(MessageWoah(None, Some(message.clone())));
                    }
                }
            }
        }
    }
}

impl Actor for GameServer {
    type Context = Context<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        self.update_sync(ctx);
    }
}

impl Handler<Connect> for GameServer {
    type Result = u32;

    fn handle(&mut self, msg: Connect, _: &mut Context<Self>) -> Self::Result {
        let id = self.rng.gen::<u32>();

        msg.addr
            .do_send(MessageWoah(Some(format!("/id\n{id}").to_owned()), None));
        {
            let other_ids: String = self
                .lobbies
                .get("main")
                .unwrap()
                .duck_ids
                .iter()
                .map(|x| format!("\n{x}"))
                .collect();

            msg.addr.do_send(MessageWoah(
                Some(format!("/join{other_ids}").to_owned()),
                None,
            ));
        }

        self.clients.insert(id, msg.addr);
        self.ducks.insert(
            id,
            Duck {
                x: 0.0,
                y: 0.0,
                z: 0.0,
                rotation: 0.0,
                score: 0,
            },
        );

        // auto join session to main lobby
        self.lobbies.get_mut("main").unwrap().duck_ids.insert(id);

        // notify all users in same lobby
        self.send_message("main", &format!("/join\n{id}"), id);

        // send id back
        id
    }
}

impl Handler<Disconnect> for GameServer {
    type Result = ();

    fn handle(&mut self, msg: Disconnect, _: &mut Context<Self>) {
        let mut lobbies: Vec<String> = Vec::new();

        // remove address
        if self.clients.remove(&msg.id).is_some() && self.ducks.remove(&msg.id).is_some() {
            // remove session from all lobbies
            for (name, lobby) in &mut self.lobbies {
                if lobby.duck_ids.remove(&msg.id) {
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

impl Handler<ClientMessage> for GameServer {
    type Result = ();

    fn handle(&mut self, msg: ClientMessage, _: &mut Context<Self>) {
        self.send_message(&msg.lobby, msg.msg.as_str(), msg.id);
    }
}

impl Handler<ListLobbies> for GameServer {
    type Result = MessageResult<ListLobbies>;

    fn handle(&mut self, _: ListLobbies, _: &mut Context<Self>) -> Self::Result {
        let lobbies = self.lobbies.keys().map(|lobby| lobby.to_owned()).collect();

        MessageResult(lobbies)
    }
}

impl Handler<Join> for GameServer {
    type Result = ();

    fn handle(&mut self, msg: Join, _: &mut Context<Self>) {
        let Join { id, name } = msg;
        let mut lobbies = Vec::new();

        // remove session from all lobbies
        for (n, lobby) in &mut self.lobbies {
            if lobby.duck_ids.remove(&id) {
                lobbies.push(n.to_owned());
            }
        }
        // send message to other users
        for lobby in lobbies {
            self.send_message(&lobby, "Someone disconnected", 0);
        }

        self.lobbies.get_mut(&name).unwrap().duck_ids.insert(id);

        self.send_message(&name, "Someone connected", id);
    }
}

impl Handler<Update> for GameServer {
    type Result = MessageResult<Update>;

    fn handle(&mut self, msg: Update, _: &mut Self::Context) -> Self::Result {
        match self.ducks.get_mut(&msg.id) {
            Some(state) => {
                state.x = msg.duck.x;
                state.y = msg.duck.y;
                state.z = msg.duck.z;
                state.rotation = msg.duck.rotation;
            }
            None => {}
        }
        MessageResult(())
    }
}
