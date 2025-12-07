use std::sync::{LazyLock, OnceLock};
use arc_swap::ArcSwap;
use sqlx::{Pool, Sqlite};
use crate::db;

static LAST_NAME: LazyLock<ArcSwap<String>> = LazyLock::new(|| {
    ArcSwap::from_pointee(String::new())
});

static LAST_TITLE: LazyLock<ArcSwap<String>> = LazyLock::new(|| {
    ArcSwap::from_pointee(String::new())
});

static POOL: OnceLock<Pool<Sqlite>> = OnceLock::new();


#[cfg(target_os = "windows")]
pub mod windows;


#[cfg(target_os = "windows")]
pub use self::windows::*;

#[cfg(target_os = "linux")]
pub mod linux;

#[cfg(target_os = "linux")]
pub use self::linux::*;