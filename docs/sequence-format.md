# Sequence JSON format

Sequence files live in `config/sequences/` and are loaded by `js/sequence-loader.js`.

## Schema

```json
{
  "title": "Evening Gentle Yoga",
  "subtitle": "stretching & breathing · ~16 minutes",
  "poses": [
    {
      "id": "arriving",
      "name": "Arriving",
      "holdSeconds": 10,
      "breath": "slow",
      "speech": "Welcome. Find a comfortable seated position."
    }
  ]
}
```

### Top-level fields

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | no | Displayed as the sequence heading. Defaults to `""` if missing. |
| `subtitle` | string | no | Displayed below the title. Defaults to `""` if missing. |
| `poses` | array | **yes** | Non-empty array of pose objects. |

### Pose fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | **yes** | Kebab-case slug, unique within the sequence. Used for future skip-to-pose URLs. Left/right variants use `-left` / `-right` suffix. |
| `name` | string | **yes** | Human-readable pose name shown in the UI. |
| `holdSeconds` | number (> 0) | **yes** | Seconds to hold *after* the speech narration finishes. This is purely the silent hold time — speech duration is not included. |
| `breath` | string | **yes** | One of `"slow"`, `"guided"`, or `"natural"`. Controls the breath-circle animation during the pose. |
| `speech` | string | **yes** | The narration text read aloud by `speechSynthesis`. |

## `holdSeconds` semantics

`holdSeconds` is the number of seconds the practitioner holds the pose **after the narration finishes speaking**. It does not include the time spent speaking.

A pose's total elapsed time is approximately: `speech duration + holdSeconds`.

The old `duration` field is no longer accepted. The validator will reject sequences that use it with an error pointing to the rename.

## Validation

`js/sequence-loader.js` exports `parseSequence(json)` which validates the schema on load. Invalid sequences throw with a descriptive error message. The runner can assume all fields are present and correctly typed after parsing.
