# ADR-008 — Finance precision remains an explicit pre-release debt

Status: temporary / must revisit before correctness sign-off.

The current Finance implementation uses JavaScript numeric exponentiation and applies rounding only at display/final-answer boundaries. This enables the full interaction/teaching architecture now, but it is not the final precision policy. A public correctness release must adopt an audited arbitrary-precision decimal strategy or establish independent numerical cross-checks for every enabled Finance skill.
