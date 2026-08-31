---
name: skeptical-review
description: 'Challenge a bug candidate by first writing the strongest non-bug explanation and forcing the claim to survive that review.'
argument-hint: 'Provide one candidate bug claim and its evidence.'
user-invocable: false
---

# Skeptical Review

Default to disbelief until the evidence survives challenge.

## Procedure
1. State the strongest reason the candidate might not be a bug.
2. Search for intentional behavior, wrapper guarantees, guards, or documented exceptions.
3. List what evidence would disprove the claim fastest.
4. Return what survived skepticism.

## Output
- Strongest non-bug explanation
- Surviving concern
- Fastest disproof path