---
title: QuietPrep helps a friend practise interviews with local AI
published: false
tags: devchallenge, weekendchallenge, hf26challenge
---

_This is a draft submission for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)._

**Draft status:** The app and synthetic demo are built. Before publishing, add the real beneficiary story and confirm the author's age eligibility. The synthetic example is not a user testimonial.

## What I Built

QuietPrep is a small interview practice partner that runs on a laptop. Enter a target role, answer one question, and get one concrete suggestion for another attempt. It keeps the first attempt beside the later ones in an optional notes download, so practice produces something you can return to.

[Add the real person you built this for, your relationship to them, the specific interview problem they described, and why this approach helps. A pseudonym is fine with their agreement. Do not claim an interview or handover that did not happen.]

I chose a quiet interface with no countdown or employability score. The aim is to make starting an answer feel manageable. The model points to a passage in the answer, suggests one improvement, and asks a follow-up question. The app checks that its quoted passage really exists in the answer.

## Demo

[Watch the local AI demo](https://github.com/TusharND12/quietprep/blob/main/docs/media/quietprep-demo.mp4).

The app runs locally at http://127.0.0.1:8767. Follow the repository setup instructions to try it; that loopback URL is not a hosted public app.

The synthetic demo follows a junior developer describing a slow search interface. It shows live local inference, a grounded quotation, and another attempt. The separate walkthrough button uses fixed examples and is explicitly labeled as a walkthrough.

[After the beneficiary tries it, add their actual observations, what did not work, and any change you made in response.]

## Code

[QuietPrep source and setup instructions](https://github.com/TusharND12/quietprep).

The project starts from an empty directory during this challenge window. The application has no npm or third-party Python dependencies. Its source is available under the MIT license; model and runtime licenses are documented separately.

## How I Built It

The core is Qwen2.5-1.5B-Instruct, an Apache 2.0 open-weight model. A quantized version runs through llama.cpp on the CPU. The model generates the interview question and reviews each answer; this is the central interaction rather than an optional add-on.

A Python server sends bounded requests to the local model. JSON schemas give the coaching a predictable structure. A short example in the review prompt helps the small model distinguish a practical instruction from a rewritten answer. I added it after the first live check returned generic feedback that repeated advice the learner already followed.

The browser renders model output as text. The server rejects feedback whose quoted evidence does not occur in the answer. Requests go only to loopback IP addresses, bypass proxies, and refuse redirects. An explicit download is the only app action that writes practice notes to disk.

I used Codex to help implement the app, inspect the rendered interface, and prepare tests and documentation. The challenge allows AI assistance. The personal story and beneficiary feedback must come from the person involved.

## Why Does Open Innovation Matter?

Interview answers can include unfinished ideas and personal experiences. Local inference lets someone practise those answers without sending them to a hosted AI service. After the first download, the same app can run without an internet connection.

Open weights also make the choice of model visible and replaceable. A small model is affordable to run on a laptop, but it is not always a great coach. I prefer documenting that tradeoff and allowing a stronger local model rather than quietly falling back to a cloud service.

The quote check is deliberately narrow: it can verify that the evidence is real, but not that the model's advice is right. That is why the interface asks the learner to reflect and try again rather than presenting an authoritative score.

## Prize Categories

Overall challenge. No partner category is claimed unless its technology was actually used and demonstrated.
