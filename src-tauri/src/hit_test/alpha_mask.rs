// Alpha mask loader and point-in-mask query for the adaptive hit-test loop.
//
// Mask format (matches scripts/generate-alpha-mask.ts):
// - 32x32 per frame, 8 frames per stage (one row of the sprite sheet each)
// - Each frame is an array of 32 hex strings (one per scanline, 8 hex chars)
// - Bit i (LSB) of the row hex word indicates pixel x = i is opaque

use std::collections::HashMap;
use std::fs;
use std::path::Path;

use serde::Deserialize;

#[derive(Debug, Clone, Copy, Hash, Eq, PartialEq)]
pub enum Stage {
    Baby,
    Adult,
    Senior,
}

impl Stage {
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "baby" => Some(Stage::Baby),
            "adult" => Some(Stage::Adult),
            "senior" => Some(Stage::Senior),
            _ => None,
        }
    }

    fn file_name(&self) -> &'static str {
        match self {
            Stage::Baby => "baby_mask.json",
            Stage::Adult => "adult_mask.json",
            Stage::Senior => "senior_mask.json",
        }
    }
}

#[derive(Debug, Deserialize)]
struct MaskFile {
    width: u32,
    height: u32,
    frames: Vec<Vec<String>>, // frames[frame_idx][row_y] = hex bit string
}

/// Per-stage mask: width/height + decoded frames as Vec<u32> rows.
#[derive(Debug)]
pub struct StageMask {
    pub width: u32,
    pub height: u32,
    /// frames[frame_idx][y] = bitmask of opaque columns at scanline y.
    pub frames: Vec<Vec<u32>>,
}

#[derive(Debug, Default)]
pub struct MaskRegistry {
    masks: HashMap<Stage, StageMask>,
}

impl MaskRegistry {
    /// Load `{baby,adult,senior}_mask.json` from `dir`. Missing or malformed
    /// files are logged and skipped — hit-test then falls back to "everything
    /// transparent" for that stage, which keeps the app usable.
    pub fn load_from_dir(dir: &Path) -> Self {
        let mut masks = HashMap::new();
        for stage in [Stage::Baby, Stage::Adult, Stage::Senior] {
            let path = dir.join(stage.file_name());
            match Self::load_one(&path) {
                Ok(m) => {
                    masks.insert(stage, m);
                }
                Err(e) => {
                    eprintln!("[mask] failed to load {}: {e}", path.display());
                }
            }
        }
        Self { masks }
    }

    fn load_one(path: &Path) -> Result<StageMask, String> {
        let raw = fs::read_to_string(path).map_err(|e| e.to_string())?;
        let file: MaskFile = serde_json::from_str(&raw).map_err(|e| e.to_string())?;
        let mut frames = Vec::with_capacity(file.frames.len());
        for (fi, frame_rows) in file.frames.into_iter().enumerate() {
            if frame_rows.len() != file.height as usize {
                return Err(format!(
                    "frame {fi}: expected {} rows, got {}",
                    file.height,
                    frame_rows.len()
                ));
            }
            let mut decoded = Vec::with_capacity(frame_rows.len());
            for (yi, hex) in frame_rows.iter().enumerate() {
                let bits = u32::from_str_radix(hex, 16).map_err(|e| {
                    format!("frame {fi} row {yi}: invalid hex '{hex}': {e}")
                })?;
                decoded.push(bits);
            }
            frames.push(decoded);
        }
        Ok(StageMask {
            width: file.width,
            height: file.height,
            frames,
        })
    }

    /// Returns true iff (x, y) is within the sprite bounds AND the pixel at
    /// `(stage, frame, x, y)` is opaque. Out-of-bounds coords are NOT opaque.
    pub fn is_opaque(&self, stage: Stage, frame: usize, x: i32, y: i32) -> bool {
        let Some(mask) = self.masks.get(&stage) else {
            return false;
        };
        if x < 0 || y < 0 {
            return false;
        }
        let (xu, yu) = (x as u32, y as u32);
        if xu >= mask.width || yu >= mask.height {
            return false;
        }
        let Some(frame_rows) = mask.frames.get(frame) else {
            return false;
        };
        let row = frame_rows[yu as usize];
        (row >> xu) & 1 == 1
    }

    pub fn frame_size(&self, stage: Stage) -> Option<(u32, u32)> {
        self.masks.get(&stage).map(|m| (m.width, m.height))
    }
}
