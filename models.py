"""Pinned model downloads. Large weights stay outside Git in .runtime/."""

MODELS = {
    "coaching": {
        "name": "Qwen3-4B-Instruct-2507",
        "alias": "qwen3-4b-instruct-2507",
        "filename": "Qwen3-4B-Instruct-2507-Q4_K_M.gguf",
        "url": "https://huggingface.co/lmstudio-community/Qwen3-4B-Instruct-2507-GGUF/resolve/4edb920b6f14e3b9284d4502a6485103d72cde05/Qwen3-4B-Instruct-2507-Q4_K_M.gguf",
        "sha256": "8cdb57cbb880d313736a9bc4e3d3d2485f145b5e19cf33783746e753e82641fc",
        "download_gb": 2.50,
    },
    "compact": {
        "name": "Qwen2.5-1.5B-Instruct",
        "alias": "qwen2.5:1.5b",
        "filename": "qwen2.5-1.5b-instruct-q4_k_m.gguf",
        "url": "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/91cad51170dc346986eccefdc2dd33a9da36ead9/qwen2.5-1.5b-instruct-q4_k_m.gguf",
        "sha256": "6a1a2eb6d15622bf3c96857206351ba97e1af16c30d7a74ee38970e434e9407e",
        "download_gb": 1.12,
    },
}
