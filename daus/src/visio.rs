use crate::vfs::{NodeType, VirtualFileSystem, VirtualNode};
use serde_json::{from_str, Map, Value};

use std::collections::HashMap;
use std::fs;
use std::fs::File;
use std::io::Result;
use std::io::Write;
use std::path::PathBuf;

pub fn load_from_file(path: &str) -> Result<VirtualFileSystem> {
    let file_content = fs::read_to_string(path)?;
    let json: Map<String, Value> = from_str(&file_content)?;
    for (k, v) in json.clone().into_iter() {
        println!("{} : {}\n", k, v);
    }

    fn parse_node(name: String, json_value: Value) -> VirtualNode {
        match json_value {
            Value::String(content) => VirtualNode {
                name,
                node: NodeType::File { content },
            },
            Value::Object(map) => {
                let mut files = HashMap::new();
                for (k, v) in map {
                    files.insert(k.clone(), parse_node(k, v));
                }
                VirtualNode {
                    name,
                    node: NodeType::Directory { files },
                }
            }
            _ => panic!("Unexpected value in JSON"),
        }
    }

    let root_node = parse_node("".to_string(), Value::Object(json));

    // let root_as_dir = fd2vn(root).unwrap();
    return Ok(VirtualFileSystem { root: root_node });
}

pub fn write_to_file(node: &VirtualNode) {
    fn write(filepath: &PathBuf, content: &String) -> std::io::Result<()> {
        let mut f = File::create(filepath)?;
        f.write_all(content.as_bytes())?;
        Ok(())
    }

    let mut path: PathBuf = PathBuf::from("tfs/");

    match &node.node {
        NodeType::Directory { files } => {
            for (fname, node) in files.iter() {
                fn maybe_make_directory(path: &PathBuf) -> std::io::Result<()> {
                    fs::create_dir_all(PathBuf::from(path))?;
                    Ok(())
                }
                maybe_make_directory(&path).unwrap();
                path.push(&fname);

                match &node.node {
                    NodeType::Directory { files: _ } => write_to_file(node),

                    NodeType::File { content } => match write(&path, &content) {
                        Err(_) => println!("Failed to write to {}", &node.name),
                        Ok(_) => println!("Successfully wrote {}", &node.name),
                    },
                }

                path.pop();
            }
        }
        NodeType::File { content } => match write(&PathBuf::from(&node.name), &content) {
            Err(_) => println!("Failed to write to {}", &node.name),
            Ok(_) => println!("Successfully wrote {}", &node.name),
        },
    }
}
