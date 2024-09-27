use serde::Deserialize;
use std::borrow::BorrowMut;
use std::{
    collections::HashMap,
    rc::{Rc, Weak},
};

#[derive(Debug, Deserialize, Clone, PartialEq)]
pub struct VirtualFileSystem {
    pub root: Rc<VirtualNode>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct VirtualNode {
    pub name: String,
    pub data: NodeType,
    #[serde(skip_deserializing)]
    pub head: Option<Weak<VirtualNode>>,
}

#[derive(Debug, Deserialize, PartialEq, Clone)]
pub enum NodeType {
    File {
        content: String,
    },
    Directory {
        files: HashMap<String, Rc<VirtualNode>>,
    },
}

impl VirtualFileSystem {
    pub fn new(root: VirtualNode) -> Self {
        VirtualFileSystem { root: root.into() }
    }
}

impl VirtualNode {
    pub fn new(name: String, data: NodeType, head: Option<Weak<VirtualNode>>) -> Self {
        VirtualNode { name, data, head }
    }

    pub fn set_files(&mut self, files: HashMap<String, Rc<VirtualNode>>) {
        if let NodeType::Directory { files: ref mut dir } = *self.data.borrow_mut() {
            *dir = files;
        } else {
            panic!("Cannot set files on a non-directory node");
        }
    }
}

impl PartialEq for VirtualNode {
    fn eq(&self, other: &Self) -> bool {
        // Compare only the `name` and `node` fields
        self.name == other.name && self.data == other.data
    }
}
