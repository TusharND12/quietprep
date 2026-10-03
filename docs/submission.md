---
title: QuietPrep — practise an honest answer, then see what changed
published: false
tags: devchallenge, weekendchallenge, hf26challenge
---

_Draft for the [Build for a Friend challenge](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01). Not submitted. The real beneficiary story and the author's 18+ eligibility still need confirmation. Every demonstration below uses synthetic data._

## What I Built

QuietPrep is a private interview practice partner. You bring a real experience, answer one question, get one specific nudge, and try that same answer again. The app puts your two attempts beside each other so you can see what changed.

[Replace this paragraph with the real person's story: who they are to you, the role they are preparing for, and the difficulty they described in their own terms. Explain one design decision that responds to that difficulty. A pseudonym is fine with their agreement. Do not invent an interview, conversation, or outcome.]

Someone starting their career may have useful experience from a class assignment or personal project but struggle to explain their own contribution. The story helper asks three small questions: what needed fixing, what you personally did, and what happened or what you learned. It joins those facts into context for the model. It does not invent experience or write a polished answer to memorize.

The practice room has no countdown or employability score. A nudge points to your own words and gives one next step. After a retry, added and removed words are highlighted. You can ask the local model to reflect on the change, or read the two attempts yourself. More words do not earn a higher score.

## Demo

[Watch the recorded local AI demo](https://github.com/TusharND12/quietprep/blob/main/docs/media/quietprep-demo.mp4).

The synthetic example describes a college library search page. The first answer describes the search form and a debounce. The revised answer adds before-and-after request counts with the same query and states that user preference has not been tested. The app shows the added sentence directly, then asks the model to explain the change using a passage from each attempt.

![Two attempts, visible word changes, and source-grounded AI reflection](https://raw.githubusercontent.com/TusharND12/quietprep/main/docs/media/comparison.png)

The demo uses actual local inference. A separate walkthrough button is labeled as a fixed example. The app runs at http://127.0.0.1:8767 after setup; that address is local to your computer. The recording lets you inspect it without downloading a model.

[After handing it over, describe what the beneficiary actually tried, which suggestion helped or missed the point, and one change you made from their feedback. Get permission before publishing their words or practice answers.]

## Code

[Source, setup, tests, and evaluation](https://github.com/TusharND12/quietprep).

The project was started on 3 October during this challenge window. The app uses Python's standard library and browser JavaScript with no application dependencies. Its source is MIT licensed; model and runtime licenses are documented separately.

## How I Built It

The recommended model is Qwen3-4B-Instruct-2507, running through llama.cpp on the CPU. A smaller Qwen2.5-1.5B option is available for laptops with less memory. Both use open weights under Apache 2.0. Setup pins downloads and checks their SHA-256 hashes.

The model generates the question, reviews the answer, and reflects on a retry. Each retry includes the earlier answer and coaching goal so the model can notice whether that goal was addressed.

The first compact-model demo exposed a real weakness: it could ask for details already present in the answer. A model can produce valid JSON and still read poorly. I added difficult synthetic cases and published the [responses and limitations](https://github.com/TusharND12/quietprep/blob/main/docs/evaluation.md). The larger model was more specific in this small sample, but it remains fallible. Learners can mark a nudge as useful, partly useful, or not yet useful and keep their own reflection in downloaded notes.

Another failure changed the implementation. Asking the model to copy a quotation sometimes produced slightly altered text. Now the server makes numbered passages from the learner's answer. A constrained schema lets the model select a passage ID, and the server displays the original text. Comparisons select one passage from each attempt. This guarantees that a displayed quotation comes from the answer; it does not guarantee that the advice follows from it.

The browser renders responses as text. Inference stays on loopback, bypasses proxies, and refuses redirects. There is no cloud fallback, analytics, database, or browser storage. Practice stays in memory unless the learner downloads their notes.

I used Codex to help implement, test, inspect the interface, and prepare documentation. The personal story and beneficiary feedback must come from the people involved.

## Why Does Open Innovation Matter?

An interview answer can contain personal experiences or unfinished ideas. Local inference gives the learner control over where those words go. After setup, the app works without an internet connection or a cloud API account.

Open weights also let the project change models when the small one falls short. That change has a cost: the recommended model is a roughly 2.50 GB download and takes longer on a CPU. The smaller option is faster, but its advice was often generic in our development checks. Those tradeoffs are visible in the repository.

QuietPrep cannot verify technical correctness or predict interview success. Its purpose is narrower: help someone practise explaining an experience, inspect their revision, and decide whether the feedback helped. An honest “I haven't measured that yet” is a valid answer.

## Prize Categories

Overall challenge. No partner category is claimed unless its technology was actually used and demonstrated.
