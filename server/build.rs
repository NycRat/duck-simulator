use protobuf_codegen::Codegen;

fn main() {
    Codegen::new()
        .pure()
        .cargo_out_dir("generated_with_pure")
        .input("src/protos/example.proto")
        .input("src/protos/update.proto")
        .input("src/protos/update_sync.proto")
        .include("src/protos")
        .run_from_script();
}
