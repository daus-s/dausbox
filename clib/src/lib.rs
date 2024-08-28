use std::collections::HashMap;
use wasm_bindgen::prelude::*;

// Define a type alias for the function signature
type CommandFn = fn(&str) -> String;

// Create a HashMap to store function names and corresponding functions
struct Interpreter {
    commands: HashMap<&'static str, CommandFn>,
}

impl Interpreter {
    fn new() -> Self {
        let mut commands: HashMap<&str, CommandFn > = HashMap::new();
        commands.insert("greet", greet);
        commands.insert("echo", echo);
        Interpreter { commands }
    }

    fn execute_command(&self, command: &str) -> String {
        let mut parts = command.splitn(2, ' ');
        let cmd_name = parts.next().unwrap_or("");
        let cmd_arg = parts.next().unwrap_or("");

        if let Some(&func) = self.commands.get(cmd_name) {
            func(cmd_arg)
        } else {
            "Unknown command".to_string()
        }
    }
}

// Define functions that will be used
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

fn echo(message: &str) -> String {
    message.to_string()
}

#[wasm_bindgen]
pub fn run_command(command: &str) -> String {
    let interpreter = Interpreter::new();
    interpreter.execute_command(command)
}
