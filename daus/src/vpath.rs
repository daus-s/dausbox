use crate::VirtualNode;

pub struct VirtualPath {
    path: Vec<String>,
}

impl VirtualPath {
    pub fn new() -> Self {
        let path = Vec::new();
        VirtualPath { path }
    }

    pub fn up(&mut self) -> Result<(), String> {
        let len: usize = self.path.len();
        if len == 0 {
            Err("Already in top level directory".to_string())
        } else {
            self.path.pop();
            Ok(())
        }
    }

    pub fn down(&mut self, curr: &VirtualNode, new_dir: &String) -> Result<(), String> {
        match &curr.node {
            crate::vfsys::NodeType::File { content: _ } => {
                Err("Cannot navigate down from a file.".to_string())
            }
            crate::vfsys::NodeType::Directory { files } => match files.get(new_dir) {
                Some(_) => {
                    self.path.push(new_dir.to_string());
                    Ok(())
                }
                None => Err("Directory not found.".to_string()), //fails as could not find directory
            },
        }
    }
}
