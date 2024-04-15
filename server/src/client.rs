use std::time::{Duration, Instant};

use actix::prelude::*;
use actix_web_actors::ws;

use crate::{protos::generated_with_pure::update::Update, server, state::State};
use protobuf::Message;

const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(5);
const CLIENT_TIMEOUT: Duration = Duration::from_secs(10);

#[derive(Debug)]
pub struct Client {
    pub id: u32,
    pub hb: Instant,
    pub addr: Addr<server::GameServer>,
}

impl Client {
    /// helper method that sends ping to client every 5 seconds (HEARTBEAT_INTERVAL).
    ///
    /// also this method checks heartbeats from client
    fn hb(&self, ctx: &mut ws::WebsocketContext<Self>) {
        ctx.run_interval(HEARTBEAT_INTERVAL, |act, ctx| {
            // check client heartbeats
            if Instant::now().duration_since(act.hb) > CLIENT_TIMEOUT {
                // heartbeat timed out
                println!("Websocket Client heartbeat failed, disconnecting!");

                // notify chat server
                act.addr.do_send(server::Disconnect { id: act.id });

                // stop actor
                ctx.stop();

                // don't try to send a ping
                return;
            }

            ctx.ping(b"");
        });
    }
}

impl Actor for Client {
    type Context = ws::WebsocketContext<Self>;

    /// Method is called on actor start.
    /// We register ws session with ChatServer
    fn started(&mut self, ctx: &mut Self::Context) {
        // we'll start heartbeat process on session start.
        self.hb(ctx);

        // register self in chat server. `AsyncContext::wait` register
        // future within context, but context waits until this future resolves
        // before processing any other events.
        // HttpContext::state() is instance of WsChatSessionState, state is shared
        // across all routes within application
        let addr = ctx.address();
        self.addr
            .send(server::Connect {
                addr: addr.recipient(),
            })
            .into_actor(self)
            .then(|res, act, ctx| {
                match res {
                    Ok(res) => act.id = res,
                    // something is wrong with chat server
                    _ => ctx.stop(),
                }
                fut::ready(())
            })
            .wait(ctx);
    }

    fn stopping(&mut self, _: &mut Self::Context) -> Running {
        // notify chat server
        self.addr.do_send(server::Disconnect { id: self.id });
        Running::Stop
    }
}

/// Handle messages from chat server, we simply send it to peer websocket
impl Handler<server::MessageWoah> for Client {
    type Result = ();

    fn handle(&mut self, msg: server::MessageWoah, ctx: &mut Self::Context) {
        if msg.0.is_some() {
            ctx.text(msg.0.unwrap());
        }
        if msg.1.is_some() {
            ctx.binary(msg.1.unwrap());
        }
    }
}

/// WebSocket message handler
impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for Client {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        let msg = match msg {
            Err(_) => {
                ctx.stop();
                return;
            }
            Ok(msg) => msg,
        };

        log::debug!("WEBSOCKET MESSAGE: {msg:?}");
        match msg {
            ws::Message::Ping(msg) => {
                self.hb = Instant::now();
                ctx.pong(&msg);
            }
            ws::Message::Pong(_) => {
                self.hb = Instant::now();
            }
            ws::Message::Text(text) => {
                let m = text.trim();
                // we check for /sss type of messages
                if m.starts_with('/') {
                    let v: Vec<&str> = m.splitn(2, ' ').collect();
                    match v[0] {
                        "/list" => {
                            // Send Listlobbies message to chat server and wait for
                            // response
                            println!("List lobbies");
                            self.addr
                                .send(server::ListLobbies)
                                .into_actor(self)
                                .then(|res, _, ctx| {
                                    match res {
                                        Ok(lobbies) => {
                                            let lobbies: String = lobbies
                                                .into_iter()
                                                .map(|lobby| "\n".to_owned() + &lobby)
                                                .collect();
                                            ctx.text(format!("/list{lobbies}"));
                                            // for lobby in lobbies {
                                            //     ctx.text(lobby);
                                            // }
                                        }
                                        _ => println!("Something is wrong"),
                                    }
                                    fut::ready(())
                                })
                                .wait(ctx)
                            // .wait(ctx) pauses all events in context,
                            // so actor wont receive any new messages until it get list
                            // of lobbies back
                        }
                        "/join" => {
                            if v.len() == 2 {
                                // self.lobby = v[1].to_owned();
                                self.addr.do_send(server::Join {
                                    id: self.id,
                                    name: v[1].to_owned(),
                                });

                                ctx.text("/join\ntrue");
                            } else {
                                ctx.text("/join\nfalse");
                            }
                        }
                        "/name" => {
                            if v.len() == 2 {
                                // self.state.name = v[1].to_owned();
                                ctx.text("/name\ntrue");
                            } else {
                                ctx.text("/name\nfalse");
                            }
                        }
                        "/update" => {
                            // if v.len() == 2 {
                            //     if let Some((x, z)) = v[1].split_once(' ') {
                            //         // println!("{x},{z}");
                            //
                            //         self.addr.do_send(server::Update {
                            //             id: self.id,
                            //             state: State {
                            //                 x: x.parse().unwrap_or_default(),
                            //                 z: z.parse().unwrap_or_default(),
                            //             },
                            //         });
                            //     }
                            // } else {
                            // }
                        }
                        _ => ctx.text(format!("/{m:?}")),
                    }
                } else {
                }
            }
            ws::Message::Binary(bytes) => {
                let in_msg = Update::parse_from_bytes(&bytes).unwrap();
                self.addr.do_send(server::Update {
                    id: self.id,
                    state: State {
                        x: in_msg.x,
                        z: in_msg.z,
                        rotation: in_msg.rotation,
                    },
                });
                // println!("{in_msg}");
            }
            ws::Message::Close(reason) => {
                ctx.close(reason);
                ctx.stop();
            }
            ws::Message::Continuation(_) => {
                ctx.stop();
            }
            ws::Message::Nop => (),
        }
    }
}
