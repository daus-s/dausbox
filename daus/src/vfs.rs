use std::collections::HashMap;

use serde::Deserialize;

#[derive(Debug, Deserialize, Clone, PartialEq)]
pub struct VirtualFileSystem {
    pub root: VirtualNode,
}

#[derive(Debug, Deserialize, PartialEq, Clone)]
pub struct VirtualNode {
    pub name: String,
    pub node: NodeType,
}

#[derive(Debug, Deserialize, PartialEq, Clone)]
pub enum NodeType {
    File { content: String },
    Directory { files: HashMap<String, VirtualNode> },
}

impl VirtualFileSystem {
    pub fn new(root: VirtualNode) -> Self {
        VirtualFileSystem { root }
    }
}

impl VirtualNode {
    pub fn new(name: String, node: NodeType) -> Self {
        VirtualNode { name, node }
    }
}
