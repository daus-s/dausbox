use crate::vfsys::{NodeType, VirtualFileSystem, VirtualNode};
use serde_json::{from_str, Map, Value};

use std::collections::HashMap;
use std::fs::{DirEntry, File};
use std::io::{Result, Write};
use std::path::{Path, PathBuf};
use std::rc::{Rc, Weak};
use std::{fs, io};

pub fn load_from_file(path: &str) -> Result<VirtualFileSystem> {
    let file_content = fs::read_to_string(path)?;
    let json: Map<String, Value> = from_str(&file_content)?;
    for (k, v) in json.clone().into_iter() {
        println!("{} : {}\n", k, v);
    }

    fn parse_node(
        name: String,
        json_value: Value,
        parent: &Option<Weak<VirtualNode>>,
    ) -> Rc<VirtualNode> {
        match json_value {
            Value::String(content) => Rc::new(VirtualNode {
                name,
                data: NodeType::File { content },
                head: *parent,
            }),
            Value::Object(map) => {
                let mut node = VirtualNode {
                    name,
                    data: NodeType::Directory {
                        files: HashMap::new(),
                    },
                    head: *parent,
                };

                let mut files = HashMap::new();
                let dickens = Some(Rc::downgrade(&Rc::new(node)));
                for (k, v) in map {
                    let child_node = parse_node(k.clone(), v, &dickens);
                    files.insert(k, child_node);
                }

                println!("{:#?}", node.clone());

                node.set_files(files);

                Rc::new(node)
            }
            _ => panic!("Unexpected value in JSON"),
        }
    }

    let root_node = parse_node("".to_string(), Value::Object(json), &None);

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

    match &node.data {
        NodeType::Directory { files } => {
            for (fname, node) in files.iter() {
                fn maybe_make_directory(path: &PathBuf) -> std::io::Result<()> {
                    fs::create_dir_all(PathBuf::from(path))?;
                    Ok(())
                }
                maybe_make_directory(&path).unwrap();
                path.push(&fname);

                match &node.data {
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

pub fn load_from_dir(home_dir: &PathBuf) -> Result<VirtualFileSystem> {
    fn visit_dirs<F>(dir: &Path, cb: &F) -> Result<VirtualNode>
    where
        F: Fn(&DirEntry) -> Result<VirtualNode>,
    {
        if !dir.is_dir() {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                format!(
                    "Expected to read a directory but was not: {}",
                    dir.display()
                ),
            ));
        }

        let mut files: HashMap<String, Rc<VirtualNode>> = HashMap::new();

        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_dir() {
                let dir_name = entry.file_name().to_string_lossy().to_string();
                let dir_node = visit_dirs(&path, cb).unwrap();
                files.insert(dir_name, dir_node.into());
            } else {
                let file_node = cb(&entry).unwrap();
                files.insert(
                    entry.file_name().to_string_lossy().to_string(),
                    file_node.into(),
                );
            }
        }

        Ok(VirtualNode {
            name: dir
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string(),
            data: NodeType::Directory { files },
            head: todo!(),
        })
    }

    fn file_to_virtualnode(file: &DirEntry) -> Result<VirtualNode> {
        fn content_fn(path: &PathBuf) -> Result<String> {
            Ok(fs::read_to_string(path).unwrap())
        }

        Ok(VirtualNode {
            name: file.file_name().to_string_lossy().to_string(),
            data: NodeType::File {
                content: content_fn(&file.path()).unwrap(),
            },
            head: todo!(),
        })
    }

    let root_node: VirtualNode = visit_dirs(&home_dir, &file_to_virtualnode).unwrap();

    Ok(VirtualFileSystem {
        root: VirtualNode {
            name: "".to_string(),
            data: root_node.data,
            head: todo!(),
        }
        .into(),
    })
}
