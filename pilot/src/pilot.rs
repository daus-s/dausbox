use daus::vfsys::{VirtualFileSystem, VirtualNode};
use daus::vpath::VirtualPath;

pub struct Navi<'a> {
    pub fsys: &'a VirtualFileSystem,
    pub path: Vec<String>, //change to a VirtualPath
    pub curr: &'a VirtualNode,
    pub prev: Option<&'a VirtualNode>,
}

impl<'a> Navi<'a> {
    pub fn new(fsys: &'a VirtualFileSystem) -> Self {
        Navi {
            fsys,
            path: Vec::new(),
            curr: &fsys.root,
            prev: None,
        }
    }

    pub fn change_dir(&mut self, new_path: VirtualPath) -> Result<VirtualNode, String> {
        if new_path.len == 0 {
            Ok(self.curr.clone())
        }
        let next: String = new_path.pop().unwrap_or("".to_string());
        if next.eq("..") {
            match self.prev {
                Some(_) => {
                    self.curr = self.prev;
                }
                None => Err("Already in top level directory".to_string()),
            }
        }
    }
}
