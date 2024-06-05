use std::{
    collections::{HashMap, HashSet},
    time::Duration,
};

#[derive(Debug)]
pub struct Lobby {
    pub duck_ids: HashMap<u32, (String, String, String)>,
    pub spectator_ids: HashSet<u32>,
    pub bread: Vec<(f32, f32, f32)>,
    pub start_time: Option<std::time::SystemTime>,
    pub now: std::time::SystemTime,
    pub game_duration: Duration,
}

impl Lobby {
    pub fn new() -> Self {
        Self {
            duck_ids: HashMap::new(),
            spectator_ids: HashSet::new(),
            bread: Vec::new(),
            start_time: None,
            now: std::time::SystemTime::now(),
            game_duration: Duration::from_secs(120),
        }
    }
}
