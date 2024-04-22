use std::time::{Duration, Instant};

use actix::prelude::*;
use actix_web_actors::ws;

use crate::{duck::Duck, protos::protos::protos, server};
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
    fn hb(&self, ctx: &mut ws::WebsocketContext<Self>) {
        ctx.run_interval(HEARTBEAT_INTERVAL, |act, ctx| {
            // check client heartbeats
            if Instant::now().duration_since(act.hb) > CLIENT_TIMEOUT {
                println!("Websocket Client heartbeat failed, disconnecting!");
                act.addr.do_send(server::Disconnect { id: act.id });
                ctx.stop();
                return;
            }

            ctx.ping(b"");
        });
    }
}

impl Actor for Client {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        self.hb(ctx);

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

                if m.starts_with('/') {
                    let v: Vec<&str> = m.splitn(2, ' ').collect();
                    match v[0] {
                        "/list" => {
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
                                        }
                                        _ => println!("Something is wrong"),
                                    }
                                    fut::ready(())
                                })
                                .wait(ctx)
                            // .wait(ctx) pauses all events in context,
                        }
                        "/join" => {
                            if v.len() == 2 {
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
                                ctx.text("/name\ntrue");
                            } else {
                                ctx.text("/name\nfalse");
                            }
                        }
                        _ => ctx.text(format!("/{m:?}")),
                    }
                } else {
                }
            }
            ws::Message::Binary(bytes) => {
                let in_msg = protos::Duck::parse_from_bytes(&bytes).unwrap();
                self.addr.do_send(server::Update {
                    id: self.id,
                    duck: Duck {
                        x: in_msg.x,
                        y: in_msg.y,
                        z: in_msg.z,
                        rotation: in_msg.rotation,
                        score: 0,
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
