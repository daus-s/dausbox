mod test {
    use daus::vfsys::{NodeType, VirtualFileSystem, VirtualNode};

    #[test]
    fn test_vn() {
        let node = VirtualNode {
            name: String::from("file.tit"),
            data: NodeType::File {
                content: String::from(
                    "☺☻♥♦♣♠\n\
                                   ♫☼\n\
                                   ►◄↕‼¶§▬↨↑↓→∟↔▲▼\n\
                                   123456789:;<=>?\n\
                                   @ABCDEFGHIJKLMNO\n\
                                   PQRSTUVWXYZ[\\]^_\n\
                                   `abcdefghijklmno\n\
                                   pqrstuvwxyz{|}~⌂",
                ),
            },
            head: None,
        };

        // Assert that the name matches
        assert_eq!(node.name, "file.tit");

        // Assert that the content matches
        if let NodeType::File { content } = &node.data {
            assert_eq!(
                content,
                "☺☻♥♦♣♠\n\
                            ♫☼\n\
                            ►◄↕‼¶§▬↨↑↓→∟↔▲▼\n\
                            123456789:;<=>?\n\
                            @ABCDEFGHIJKLMNO\n\
                            PQRSTUVWXYZ[\\]^_\n\
                            `abcdefghijklmno\n\
                            pqrstuvwxyz{|}~⌂"
            );
        } else {
            panic!("Expected File node type");
        }
    }
}
