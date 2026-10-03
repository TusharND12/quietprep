---
title: QuietPrep — helping my friend Nilesh approach practice with more confidence
published: true
tags: devchallenge, weekendchallenge, hf26challenge
canonical_url: https://dev.to/tushar_dhokane_b6452dc29d/quietprep-helping-my-friend-nilesh-approach-practice-with-more-confidence-2fo6
---

_This is a submission for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)._

## What I Built

My friend Nilesh is preparing for the placement interview exam. Alongside preparation, he was dealing with a fear of rejection.

Nilesh has used QuietPrep and now feels more confident and less afraid. That personal change matters to me. His experience is an encouraging starting point; any effect on exam performance remains unmeasured.

QuietPrep is a private practice partner that runs on a laptop. It currently offers interview-style questions and practice explaining technical thinking. Its focus is answering, reflecting, and trying again. Placement syllabus coverage and mock-exam scoring are outside the current build.

The interaction is simple:

1. Choose a role and practice focus.
2. Answer one question.
3. Read one coaching suggestion.
4. Try the same question again.
5. Compare the two attempts.

There is no countdown or employability score. The learner gets space to attempt an answer and decide what to change.

A story helper also organizes a real experience around three questions: what needed fixing, what you personally did, and what happened or what you learned. It uses the learner's own facts.

After a retry, added and removed words are highlighted. The learner can request an AI reflection, record whether the suggestion helped, and download both attempts with their notes.

## Demo

[Watch the 62-second captioned demo](https://github.com/TusharND12/quietprep/blob/main/docs/media/quietprep-demo.mp4).

The recording uses fictional interview answers with actual local model responses. It does not contain Nilesh's private practice answers.

The example follows a college library search project. The first answer describes a technical change. The revision adds before-and-after request counts and states that user preference has not been tested.

![QuietPrep showing two attempts and their word changes](https://raw.githubusercontent.com/TusharND12/quietprep/main/docs/media/comparison.png)

The app shows exactly which words changed. The optional AI reflection then interprets the revision using passages from both attempts.

The recording also exposes a weakness: the model sometimes assumes that fewer requests imply a user-experience benefit. I kept this visible and documented it. The learner still needs to inspect the advice.

After setup, QuietPrep opens at `http://127.0.0.1:8767` on the learner's computer.

## Code

[QuietPrep source code, setup instructions, and tests](https://github.com/TusharND12/quietprep)

Development began on 3 October 2026 during this challenge window.

The application uses Python's standard library and browser JavaScript, with no third-party application dependencies. Its source is MIT licensed; model and runtime licenses are documented separately.

## How I Built It

QuietPrep uses Qwen3-4B-Instruct-2507 through llama.cpp for local CPU inference. A smaller Qwen2.5-1.5B option is available for laptops with less memory. Both models use open weights under Apache 2.0.

The model generates questions, reviews answers, and reflects on revisions. Each retry includes the earlier answer and coaching goal, giving the model context for what the learner was trying to improve.

An early failure changed the implementation. When asked to copy evidence from an answer, the model sometimes altered the wording.

The server now extracts numbered passages from the original answer. The model selects a passage ID, and the server displays the original text. Comparisons select one passage from each attempt.

This establishes where a quotation came from. The usefulness and correctness of the interpretation still require review.

I tested vague answers, answers with measurements already present, irrelevant responses, embedded instructions, and revisions. The [published evaluation](https://github.com/TusharND12/quietprep/blob/main/docs/evaluation.md) includes failures and earlier response snapshots.

Twenty Python tests and four JavaScript tests passed. Browser checks exercised actual local inference, retries, comparisons, notes downloads, session clearing, and mobile layout. GitHub CI passed on Python 3.11 and 3.14.

I used Codex to help implement, test, inspect the interface, and prepare documentation.

## Why Does Open Innovation Matter?

Practice answers can contain personal experiences and unfinished ideas. Local inference gives the learner control over where those words go.

After the initial downloads, QuietPrep works without an internet connection or cloud API account. There are no external fonts, analytics, database, or automatic answer files. Practice stays in memory unless the learner downloads their notes.

Open weights also make the model replaceable. The recommended model is approximately a 2.50 GB download. The compact option uses less memory and runs faster, although its coaching was often less specific in the development examples.

These tradeoffs are documented so someone can choose what works on their laptop.

For Nilesh, the encouraging outcome so far is feeling less afraid after using the platform. The next step is to understand which interactions helped him and improve the tool around that feedback.

QuietPrep gives a learner room to attempt an answer, inspect a suggestion, and make another attempt. An honest "I haven't measured that yet" is a valid answer.

## Prize Categories

Overall challenge.
