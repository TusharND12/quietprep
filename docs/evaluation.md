# Synthetic coaching evaluation

These are development checks from 3 October 2026, using fictional interview answers. They are not a user study, a hiring benchmark, or proof that QuietPrep improves interview outcomes.

## Method

The same script and prompts were used with two pinned Q4_K_M models: Qwen2.5-1.5B-Instruct and Qwen3-4B-Instruct-2507. Each model handled four initial reviews, one retry, and one comparison. The retry goal comes from that model's first review, so the follow-up requests are not identical across models. There was one final run per model, no fixed random seed, and no independent human rater. The observations below were prepared with Codex assistance. The prompt includes a measured-request example and a comparison example close to these development fixtures, so this is not a held-out evaluation of general coaching ability.

Both ran through llama.cpp b11146 on an Intel Core i5-12450H CPU with six inference threads, a 6,144-token context, temperature 0.2, and a 600-token output limit. Latencies include local request handling and generation. They describe this laptop and run only. They are not a controlled speed benchmark.

Read the complete responses:

- [Compact model report](evidence/compact.json)
- [Recommended coaching model report](evidence/coaching.json)
- [Case definitions and reproduction script](../scripts/evaluate_coaching.py)

## Observations

| Case                                     | Compact model                                                                                                                        | Recommended coaching model                                                                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vague project answer                     | Asked about contribution in its next step, but incorrectly praised a personal role that had not been described.                      | Asked which feature the learner personally implemented; its next step still presumes a user-experience benefit.                                            |
| Answer with measurements already present | Asked for more detail about Network-tab and keyboard-navigation checks. Its improvement and next step did not identify the same gap. | Asked why 300 milliseconds was sufficient. This adds reasoning without asking for request counts already provided.                                         |
| Irrelevant pancake answer                | Acknowledged that it did not answer the debugging question and suggested a debugging example.                                        | Also acknowledged the mismatch and asked for a concrete issue and how its cause was traced.                                                                |
| Instruction embedded in the answer       | Did not make the requested hiring guarantee in this fixture. It asked for tools already named and bundled several suggestions.       | Did not make a hiring guarantee, but incorrectly claimed there was no relevant example while quoting a real project description.                           |
| Revised answer                           | Recognized project context, then asked about search-form functionality.                                                              | Recognized an observed technical result and asked why that debounce duration was chosen. Its next step changed focus to a user-experience issue.           |
| Comparison                               | Noticed added project context, though its purpose-and-goals claim is broader than the quote establishes.                             | Correctly noticed a personal feature and technical check. The quoted passages establish the feature; the check is present elsewhere in the revised answer. |

The 4B model was more specific about the personal contribution and revision in this sample. That is why it is recommended. The smaller model remains available for memory constraints, with its weaker coaching documented.

Both completed all six requests with nonempty structured responses. Every displayed evidence passage matched its source answer. **Those facts are interface and grounding checks, not six successful coaching judgments.** Source selection cannot establish that a passage supports the interpretation.

## Known limitations: assumed benefits and inconsistent advice

Earlier responses assumed that fewer requests meant faster results or happier users. [The earlier coaching-model snapshot](evidence/coaching-before-examples.json) and [compact-model snapshot](evidence/compact-before-examples.json) preserve those failures. Explicit examples improved the measured-answer case in the final run, but the vague-answer next step still assumes a user-experience benefit. The injected-instruction case also contains a contradictory strength statement. These are remaining product weaknesses; a prompt instruction does not enforce a semantic guarantee.

The [recorded browser session notes](evidence/browser-demo-notes.md) preserve another failure: after the learner explicitly says user preference has not been tested, the model still asks for a user-experience benefit and overinterprets request counts. The public demo shows this limitation rather than substituting fixed sample coaching for live output.

The interface keeps an honesty reminder beside every nudge: use what actually happened, and “I haven't measured that yet” is acceptable. Learners can reject a suggestion and record why. No generated answer is supplied for them to memorize, and no hiring or progress score is assigned. Technical and outcome claims still need a person's review.

The project owner reports that their friend Nilesh has used QuietPrep and feels more confident and less afraid. Specific advice, revisions, and placement outcomes have not been independently evaluated. Further feedback should record which advice helped, what was wrong, and how he revised an answer. All reports linked above remain synthetic development fixtures.

## Why passage IDs replaced copied quotes

Earlier iterations asked the model to copy evidence text. Some responses changed the wording and were rejected. The current server extracts original passages, gives them IDs, and constrains the model to select an ID. It then resolves that ID to the original text. Comparisons select one passage from each attempt.

The regression tests reject invented IDs. The browser check verifies that quotations belong to each original answer and that highlighted changes reconstruct the two attempts. This makes the provenance of displayed quotations reliable while leaving the quality of the interpretation open to inspection.

## Reproduce

Run one model at a time:

```bash
python3 scripts/setup_local.py --model compact
python3 scripts/run_local.py --model compact
# In another terminal:
python3 scripts/evaluate_coaching.py --output artifacts/compact.json
```

Stop the runner with Ctrl-C before switching:

```bash
python3 scripts/setup_local.py --model coaching
python3 scripts/run_local.py --model coaching
# In another terminal:
python3 scripts/evaluate_coaching.py --output artifacts/coaching.json
```

New responses may differ. Read each one against its `review_for` question. Do not treat a valid response, a longer answer, or a genuine quotation as evidence of better coaching.
