use axum::{
    http::StatusCode,
    response::{Html, IntoResponse},
    routing::{get, get_service},
    Router,
};
use std::net::SocketAddr;
use std::path::PathBuf;
use tokio::fs::File;
use tokio::io::AsyncReadExt;
use tower_http::services::ServeDir;

use daus::vfsys;

#[tokio::main]
async fn main() {
    let static_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("static");

    let app = Router::new().route("/", get(serve_html)).nest_service(
        "/static",
        get_service(ServeDir::new(static_dir)).handle_error(|_| async move {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Error: {}", "error"),
            )
        }),
    );

    let addr = SocketAddr::from(([127, 0, 0, 1], 248));
    println!("Listening on {}:", addr);
    let listener = tokio::net::TcpListener::bind(addr.to_string())
        .await
        .unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn serve_html() -> impl IntoResponse {
    match read_html_file("static/index.html").await {
        Ok(html_content) => (StatusCode::OK, Html(html_content)),
        Err(_) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Html("Error loading page".to_string()),
        ),
    }
}

async fn read_html_file(file_path: &str) -> Result<String, std::io::Error> {
    let mut file = File::open(file_path).await?;
    let mut contents = String::new();
    file.read_to_string(&mut contents).await?;
    Ok(contents)
}
