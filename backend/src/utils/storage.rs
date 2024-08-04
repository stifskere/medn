use std::{fs::{metadata, File}, io::{BufRead, BufReader, Result}, os::unix::fs::MetadataExt, path::PathBuf};

use sysinfo::Disks;

pub fn get_device_name_for(path: PathBuf) -> Option<String> {
    let device_id = match metadata(&path) {
        Ok(meta) => meta.dev(),
        Err(_) => return None
    };

    let file = match File::open("/proc/mounts") {
        Ok(file) => file,
        Err(_) => return None
    };

    BufReader::new(file).lines()
        .map_while(Result::ok)
        .map(|line| {
            let parts: Vec<String> = line.split_whitespace().map(String::from).collect();
            parts
        })
        .find_map(|parts| parts.get(1)
            .map(PathBuf::from)
            .and_then(|mount_point_path| metadata(&mount_point_path).ok()
                .map(|m| m.dev())
                .filter(|&mount_device_id| mount_device_id == device_id)
                .map(|_| parts[0].clone())
            )
        )
}

pub fn get_path_storage(path: PathBuf) -> Option<u64> {
    get_device_name_for(path)
        .map(|device_name| Disks::new_with_refreshed_list()
            .list()
            .iter()
            .find(|disk| disk.name().to_string_lossy() == device_name)
            .map(|disk| disk.available_space())
        )?
}
