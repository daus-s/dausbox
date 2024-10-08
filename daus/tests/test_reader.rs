mod test {

    use std::fs;

    use daus::vfsys::{NodeType, VirtualFileSystem, VirtualNode};
    use daus::visio::*;
    use std::path::PathBuf;

    #[test]
    fn test_vns() {
        // Define the expected node
        let foo_bar = VirtualNode {
            name: String::from("foo.bar"),
            data: NodeType::File {
                content: String::from("☺☻♥♦♣♠\n♫☼\n\n►◄↕‼¶§▬↨↑↓→∟↔▲▼\n123456789:;<=>?\n@ABCDEFGHIJKLMNO\nPQRSTUVWXYZ[\\]^_\n`abcdefghijklmno\npqrstuvwxyz{|}~⌂"),
            },            
            head: None,
        };

        let thisisafile_dick = VirtualNode {
            name: String::from("thisisafile.dick"),
            data: NodeType::File {
                content: String::from("content1content1"),
            },
            head: None,
        };

        // Load node from file
        let test_vfs = load_from_file("test.json").expect("Failed to load node from file");
        println!("{:#?}", test_vfs);

        if let NodeType::Directory { files } = &test_vfs.root.data {
            let test = files.get("thisisafile.dick").unwrap();
            let meme = files.get("foo.bar").unwrap();
            assert_eq!(foo_bar, **meme);
            assert_eq!(thisisafile_dick, **test);
        } else {
            panic!("Expected root node to be a Directory.");
        }
    }

    #[test]
    fn test_ffs() {
        let test_node = load_from_file("dir.json").expect("Failed to load node from file");
        assert_eq!(test_node.root.name, "");
    }

    #[test]
    fn test_visio() {
        let tf: VirtualFileSystem =
            load_from_file("test.json").expect("Failed to load node from file");
        write_to_file(&tf.root);
        let thisisafile: String = fs::read_to_string("tfs/thisisafile.dick").unwrap();
        let foooooooooo: String = fs::read_to_string("tfs/foo.bar").unwrap();
        println!("{}", thisisafile);
        println!("{}", foooooooooo);
        if let NodeType::Directory { files } = &tf.root.data {
            let test = files.get("thisisafile.dick").unwrap();
            if let NodeType::File { content } = &test.data {
                println!("{:#?}", test);
                assert_eq!(&thisisafile, content);
            } else {
                panic!("Expected test file {}, to be a files.", &test.name);
            }

            let meme = files.get("foo.bar").unwrap();
            if let NodeType::File { content } = &meme.data {
                println!("{:#?}", meme);
                assert_eq!(&foooooooooo, content);
            } else {
                panic!("Expected test file {}, to be a files.", &test.name);
            }
        } else {
            panic!("Expected root node to be a Directory.");
        }
    }

    #[test]
    fn test_read_from_dir() {
        let path: PathBuf = PathBuf::from("./tfs");
        let fdir: VirtualFileSystem = load_from_dir(&path).unwrap();

        let lfir: VirtualFileSystem = load_from_file("test.json").unwrap();

        assert_eq!(&fdir, &lfir);
    }
}
