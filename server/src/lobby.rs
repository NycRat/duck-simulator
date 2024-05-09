use std::collections::HashMap;

#[derive(Debug)]
pub struct Lobby {
    pub duck_ids: HashMap<u32, (String, String, String)>,
    pub bread: Vec<(f32, f32, f32)>,
    pub start_time: Option<std::time::Instant>,
    pub now: std::time::Instant,
}

impl Lobby {
    pub fn new() -> Self {
        Self {
            duck_ids: HashMap::new(),
            bread: Vec::new(),
            start_time: None,
            now: std::time::Instant::now(),
        }
    }
}
