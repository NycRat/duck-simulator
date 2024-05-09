use crate::duck::Duck;
use crate::lobby;
use crate::protos::protos::protos;
use protobuf::Message as OtherMessage;
use std::{
    collections::HashMap,
    f32::consts::PI,
    time::{Duration, UNIX_EPOCH},
};

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
    pub name: String,
    pub variety: String,
    pub color: String,
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

#[derive(Message)]
#[rtype(result = "()")]
pub struct StartGame {
    pub lobby: String,
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
            let mut resets: Vec<String> = vec![];

            for lobby_name in &lobbies {
                if let Some(lobby) = act.lobbies.get_mut(lobby_name) {
                    if lobby.start_time.is_none() {
                        // TODO REFACTOR THIS BETTER
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
                        act.send_message_binary(lobby_name, out_msg.write_to_bytes().unwrap(), 0);
                        continue;
                    }

                    let delta_time = lobby.now.elapsed().as_secs_f32();
                    lobby.now = std::time::Instant::now();

                    let game_over = lobby.now - lobby.start_time.unwrap() >= GAME_DURATION;

                    if game_over {
                        lobby.start_time = None;
                        resets.push(lobby_name.to_owned());

                        let mut highest_scores = vec![(0, 0); 3.min(lobby.duck_ids.len())];

                        for (id, _) in &lobby.duck_ids {
                            let duck = act.ducks.get_mut(id).unwrap();
                            for i in 0..highest_scores.len() {
                                if duck.score >= highest_scores[i].0 {
                                    highest_scores.insert(i, (duck.score, *id));
                                    highest_scores.pop();
                                    break;
                                }
                            }
                            duck.x = 0.0;
                            duck.y = 0.0;
                            duck.z = 4.0;
                            duck.rotation = 0.0;
                        }

                        for i in 0..highest_scores.len() {
                            let id = highest_scores[i].1;
                            if id == 0 {
                                println!("WHYY");
                                continue;
                            }
                            let duck = act.ducks.get_mut(&id).unwrap();
                            println!("{}: {id}", highest_scores[i].0);
                            duck.x = -1.25 + i as f32 * 1.25;
                            duck.y = 0.0;
                            duck.z = -0.5;
                            duck.rotation = 0.0;
                        }

                        println!("ENDED GAME FOR LOBBY {}", lobby_name);
                    } else {
                        // UPDATE BREAD
                        for (_, y, _) in &mut lobby.bread {
                            let gravity = -5.0;
                            // sqrt(v^2 - 2as) = u
                            let velocity = -f32::sqrt(f32::abs(2.0 * gravity * (10.0 - *y)));
                            *y += velocity * delta_time + 0.5 * gravity * delta_time.powi(2);
                            *y = y.max(0.1);
                        }

                        // INTERSECTIONS
                        for (id, _) in &lobby.duck_ids {
                            let duck = act.ducks.get_mut(id).unwrap();
                            let duck_pos = &(duck.x, duck.y, duck.z);

                            let duck_size = &(0.5, 0.5, 0.5);
                            let bread_size = &(0.2, 0.2, 0.2);

                            let mut i = 0;
                            while i < lobby.bread.len() {
                                let bread_pos = lobby.bread.get(i).unwrap();

                                type Vec3 = (f32, f32, f32);
                                fn intersect(
                                    a: &Vec3,
                                    b: &Vec3,
                                    a_size: &Vec3,
                                    b_size: &Vec3,
                                ) -> bool {
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
                        let y = 10.0;

                        let theta = act.rng.gen_range(0.0..(PI * 2.0));
                        let r = act.rng.gen_range(0.0..11.5);

                        let x = f32::sin(theta) * r;
                        let z = f32::cos(theta) * r;

                        out_msg.bread_x = Some(x);
                        out_msg.bread_y = Some(y);
                        out_msg.bread_z = Some(z);

                        lobby.bread.push((x, y, z));
                    }

                    // println!("BINARY: {:?}", out_msg.write_to_bytes().unwrap().size());
                    act.send_message_binary(lobby_name, out_msg.write_to_bytes().unwrap(), 0);
                    if game_over {
                        act.send_message(&lobby_name, "/game_end", 0);
                    }
                }
            }
            for reset in &resets {
                act.lobbies.remove(reset);
                act.lobbies.insert(reset.to_owned(), lobby::Lobby::new());
            }
        });
    }

    fn send_message(&self, lobby: &str, message: &str, skip_id: u32) {
        if let Some(lobby) = self.lobbies.get(lobby) {
            for (id, _) in &lobby.duck_ids {
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
            for (id, _) in &lobby.duck_ids {
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

        if self.lobbies.get("main").unwrap().start_time.is_some() {
            return id;
        }

        // notify of existing ducks in lobby
        msg.addr
            .do_send(MessageWoah(Some(format!("/id\n{id}").to_owned()), None));
        {
            let other_infos: String = self
                .lobbies
                .get("main")
                .unwrap()
                .duck_ids
                .iter()
                .map(|(id, info)| format!("\n{} {} {} {}", id, info.0, info.1, info.2))
                .collect();

            msg.addr.do_send(MessageWoah(
                Some(format!("/join{other_infos}").to_owned()),
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

        // notify all users in same lobby
        self.send_message(
            "main",
            &format!("/join\n{id} {} {} {}", msg.name, msg.variety, msg.color),
            id,
        );

        self.lobbies
            .get_mut("main")
            .unwrap()
            .duck_ids
            .insert(id, (msg.name, msg.variety, msg.color));

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
                if lobby.duck_ids.remove(&msg.id).is_some() {
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

    fn handle(&mut self, _msg: Join, _: &mut Context<Self>) {
        panic!("NOT IMPLEMENTED YET");
        // let Join { id, name } = msg;
        // let mut lobbies = Vec::new();
        //
        // // remove session from all lobbies
        // for (n, lobby) in &mut self.lobbies {
        //     if lobby.duck_ids.remove(&id).is_some() {
        //         lobbies.push(n.to_owned());
        //     }
        // }
        // // send message to other users
        // for lobby in lobbies {
        //     self.send_message(&lobby, "Someone disconnected", 0);
        // }
        //
        // self.lobbies.get_mut(&name).unwrap().duck_ids.insert(id);
        //
        // self.send_message(&name, "Someone connected", id);
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

impl Handler<StartGame> for GameServer {
    type Result = MessageResult<StartGame>;

    fn handle(&mut self, msg: StartGame, _: &mut Self::Context) -> Self::Result {
        if let Some(lobby) = self.lobbies.get(&msg.lobby) {
            if lobby.start_time.is_none() {
                println!(
                    "STARTED GAME FOR LOBBY {} WITH {} DUCKS",
                    &msg.lobby,
                    self.ducks.len()
                );
                let now = Some(std::time::Instant::now());
                self.send_message(
                    &msg.lobby,
                    &format!(
                        "/start_game\n{:?}",
                        std::time::SystemTime::now()
                            .duration_since(UNIX_EPOCH)
                            .unwrap()
                            .as_secs(),
                    ),
                    0,
                );
                self.lobbies.get_mut(&msg.lobby).unwrap().start_time = now;
                // lobby.start_time = now;
            }
        }
        MessageResult(())
    }
}
