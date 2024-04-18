use std::collections::HashSet;

#[derive(Debug)]
pub struct Lobby {
    pub duck_ids: HashSet<u32>,
    pub bread: Vec<(f32, f32, f32)>,
    pub start_time: std::time::Instant,
    pub now: std::time::Instant,
}

impl Lobby {
    pub fn new() -> Self {
        Self {
            duck_ids: HashSet::new(),
            bread: Vec::new(),
            start_time: std::time::Instant::now(),
            now: std::time::Instant::now(),
        }
    }
}
