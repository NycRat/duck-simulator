use std::time::Instant;

use actix::*;
use actix_web::{middleware::Logger, web, App, Error, HttpRequest, HttpResponse, HttpServer};
use actix_web_actors::ws;

mod client;
mod duck;
mod lobby;
mod protos;
mod server;

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
    dotenvy::dotenv().unwrap();

    let local_ip = local_ip_address::local_ip().unwrap();

    let server = server::GameServer::new().start();

    // let host = std::env::var("HOST").unwrap();
    let host = local_ip.to_string();
    let port: i32 = std::env::var("PORT").unwrap().parse().unwrap();

    log::info!("starting HTTP server at http://{}:{}", host, port);

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(server.clone()))
            .route("/ws", web::get().to(ws_route))
            .wrap(Logger::default())
    })
    .workers(2)
    // .bind(("10.13.22.110", 8000))?
    .bind(format!("{host}:{port}"))?
    .run()
    .await
}
