use daus::vfs::{VirtualFileSystem, VirtualNode};

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
}
