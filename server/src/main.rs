use std::time::Instant;

use actix::*;
use actix_web::{middleware::Logger, web, App, Error, HttpRequest, HttpResponse, HttpServer};
use actix_web_actors::ws;

mod client;
mod server;
mod state;

/// Entry point for our websocket route
async fn ws_route(
    req: HttpRequest,
    stream: web::Payload,
    srv: web::Data<Addr<server::GameServer>>,
) -> Result<HttpResponse, Error> {
    ws::start(
        client::Client {
            id: 0,
            hb: Instant::now(),
            addr: srv.get_ref().clone(),
        },
        &req,
        stream,
    )
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    // start chat server actor
    let server = server::GameServer::new().start();

    log::info!("starting HTTP server at http://localhost:8000");

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(server.clone()))
            .route("/ws", web::get().to(ws_route))
            .wrap(Logger::default())
    })
    .workers(2)
    .bind(("127.0.0.1", 8000))?
    .run()
    .await
}
