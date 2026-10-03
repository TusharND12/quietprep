# QuietPrep

QuietPrep is a private interview practice partner for someone preparing for an early-career job. Build a story from your real experience, answer one question, and get a specific next step. Retry the answer and see your actual word changes side by side. Local open-weight inference needs no cloud API, account, or internet after setup.

Built starting 3 October 2026 for the [Hacktoberfest Build for a Friend challenge](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01). The project owner reports that their friend Nilesh, who is preparing for GATE, has used QuietPrep and feels more confident and less afraid. This is a personal account; exam performance has not been measured. QuietPrep currently supports interview-style communication practice, with GATE syllabus coverage and mock-exam scoring outside its scope. The [challenge article](https://dev.to/tushar_dhokane_b6452dc29d/quietprep-helping-my-friend-nilesh-approach-practice-with-more-confidence-2fo6) was published on 3 October 2026.

[Watch the live local AI demo](docs/media/quietprep-demo.mp4). It uses synthetic data and shows a generated question, feedback, a retry, side-by-side changes, and a notes export.

![QuietPrep interview practice interface](docs/media/desktop.png)

## Run on Linux

Requires Linux x86_64, Python 3.11+, about 3 GB of disk space, and about 5 GB of free RAM for the recommended 4B model. A GPU is optional; the supplied runner uses the CPU. The app itself has no Python or npm dependencies.

```bash
python3 scripts/setup_local.py
python3 scripts/run_local.py
```

Open **http://127.0.0.1:8767**. Ctrl-C stops the model and app.

Setup downloads a pinned llama.cpp CPU runtime and Qwen3-4B-Instruct-2507 Q4_K_M weights quantized by LM Studio Community, verifies both SHA-256 checksums, and keeps them inside `.runtime/`. It does not install anything globally. The recommended model download is approximately 2.50 GB. Downloads require internet; inference does not.

For a smaller, faster model on a laptop with less RAM, use:

```bash
python3 scripts/setup_local.py --model compact
python3 scripts/run_local.py --model compact
```

This uses the original Qwen2.5-1.5B-Instruct model (1.12 GB download; allow about 3 GB free RAM). The compact model can give more generic advice. Both model sizes run entirely locally. See the [synthetic evaluation](docs/evaluation.md) for observations and limits.

The Linux archive may require a recent glibc. If it cannot start on your distribution, use the Ollama option below. Model startup diagnostics are in `.runtime/model.log`; the bundled runner reduces logging verbosity and does not enable prompt logging.

## Run with Ollama on other platforms

Install [Ollama](https://ollama.com/download) using its official instructions, then:

```bash
ollama pull qwen2.5:1.5b
ollama serve
```

If Ollama is already running, skip `ollama serve`. In another terminal:

```bash
python3 server.py
```

The default standalone backend is Ollama at `http://127.0.0.1:11434`, using the compact Qwen2.5 model. To change the local model, set `QUIETPREP_MODEL` before starting the server. Model URLs must use a loopback IP; remote or cloud backends are rejected. For the recommended coaching model, Ollama can run the same community GGUF:

```bash
ollama pull hf.co/lmstudio-community/Qwen3-4B-Instruct-2507-GGUF:Q4_K_M
QUIETPREP_MODEL=hf.co/lmstudio-community/Qwen3-4B-Instruct-2507-GGUF:Q4_K_M python3 server.py
```

On PowerShell, set that model string with `$env:QUIETPREP_MODEL` before starting `python server.py`. The bundled Linux runner is the inference path verified by the browser test; the Ollama adapter is also supported but has not been exercised with every model tag.

On Linux/macOS:

```bash
QUIETPREP_MODEL=qwen2.5:7b python3 server.py
```

On PowerShell:

```powershell
$env:QUIETPREP_MODEL = "qwen2.5:7b"
python server.py
```

Pull the selected model first. Larger models need more RAM and can be slower. The recommended 4B model offers more specific coaching in our small development sample; the 1.5B option is available for tighter memory budgets.

## Practise

1. Enter your target role and choose behavioral, project, or technical practice. Context is optional. The story helper can turn your own problem, action, and outcome into context without inventing experience.
2. Select **Let’s practise** and answer the generated question.
3. Select **Give me a nudge** to get feedback. The model selects a numbered passage; the server displays your original words instead of letting it author a quotation.
4. Select **Try my answer again** to keep and edit your answer. Previous attempts remain in memory and appear in downloaded notes.
5. After two attempts, see additions and removals highlighted side by side. **Reflect on this change** asks the model to explain a change using source-selected passages from both attempts. The counts show word edits, not an objective improvement score.
6. Optionally record whether a nudge helped and why. Download notes to keep your attempts, comparison, and own reflections, or clear the session to remove the app’s copy.

**See how it feels** is a clearly marked, fixed walkthrough. Its sample feedback is not model-generated. Start a live practice session for feedback on your own answer.

## Privacy and limits

The browser sends text only to the local QuietPrep server, which calls a loopback model endpoint. Outbound inference requests bypass environment proxies and refuse redirects. The app uses no external fonts, scripts, analytics, database, browser storage, or automatic answer files. It binds to `127.0.0.1` and rejects cross-site POSTs and untrusted Host headers.

Your answer and previous attempts live in the browser’s memory until you clear the session or close the page. The model process also holds recent inference context in RAM. Closing the model releases that process memory; clearing the UI does not forcibly wipe model or operating-system memory. An explicit download saves notes to your chosen download folder. External model runtimes such as Ollama have their own settings; consult their logging documentation.

Small models can be generic or wrong. Source selection establishes that quoted passages exist in your answer; it does not prove that they support the coaching or that the advice is correct. QuietPrep is a communication practice tool, not a hiring score or technical grading system. Verify technical advice. No model has access to files, tools, or external sites through this app.

## Verify

```bash
python3 -m unittest discover -s tests -v
node --check public/app.js
node --test tests/changes.test.mjs
```

The tests cover invalid requests, local endpoint restrictions, cross-site access, invented evidence IDs, comparison grounding, retry context, word changes, malformed model responses, request limits, and concurrent inference. They do not require a downloaded model.

For the browser test, run QuietPrep, then start Chrome with a separate profile and DevTools port:

```bash
google-chrome --headless=new --disable-gpu --no-first-run \
  --user-data-dir=/tmp/quietprep-browser \
  --remote-debugging-address=127.0.0.1 --remote-debugging-port=9225 about:blank
```

In another terminal, using Node 22+:

```bash
node scripts/browser_check.mjs
```

This checks real inference, source grounding, retry, word changes, comparison, example labeling, session clearing, the setup dialog, and mobile overflow. It saves screenshots and synthetic sample responses under `artifacts/`, which is excluded from Git. Do not replace the synthetic test data with personal information if you plan to share the artifacts.

To regenerate the captioned demo, run `node scripts/browser_check.mjs --record`, then `python3 scripts/render_demo.py`. Rendering requires ffmpeg. The recording is sampled at approximately two frames per second and is not a latency benchmark.

To inspect coaching on difficult synthetic examples while the app is running:

```bash
python3 scripts/evaluate_coaching.py
```

The report records request success, quoted evidence, and latency. Read the responses yourself; successful requests are not a coaching quality score. The cases and development observations are documented in [evaluation.md](docs/evaluation.md).

## Open components and licenses

- This app: MIT, see [LICENSE](LICENSE).
- Recommended [Qwen3-4B-Instruct-2507](https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507): Apache 2.0. [LM Studio Community GGUF weights](https://huggingface.co/lmstudio-community/Qwen3-4B-Instruct-2507-GGUF), pinned revision `4edb920b6f14e3b9284d4502a6485103d72cde05`.
- Compact [Qwen2.5-1.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct): Apache 2.0. Official [GGUF weights](https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF), revision `91cad51170dc346986eccefdc2dd33a9da36ead9`.
- [llama.cpp](https://github.com/ggml-org/llama.cpp): MIT, pinned runtime `b11146`.
- Optional [Ollama](https://github.com/ollama/ollama): MIT.

The setup script downloads these components separately; their licenses remain applicable. The app implementation and writing were prepared with Codex assistance. The beneficiary account was supplied by the project owner. Public demo and evaluation artifacts use synthetic data; no interview transcript, direct testimonial quotation, or contest outcome is claimed.
