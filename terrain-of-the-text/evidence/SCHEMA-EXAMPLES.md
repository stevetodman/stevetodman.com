# Schema Examples — Round 0

These are development examples, not yet runtime data.

## Contested place example: Sychar

```js
{
  id: "sychar",
  biblicalName: "Sychar",
  placeConfidence: "contested",
  candidates: [
    {
      id: "askar",
      label: "Askar",
      coords: [32.217760, 35.288970],
      coordinateSource: "OpenBible.info citing Digital Archaeological Atlas of the Holy Land",
      evidenceStatus: "serious-candidate",
      sources: ["https://www.openbible.info/geo/modern/mb04b16/askar"]
    },
    {
      id: "tell-balatah-shechem",
      label: "Tell Balatah / Shechem",
      coords: [32.213611, 35.281944],
      coordinateSource: "OpenBible.info cross-reference",
      evidenceStatus: "serious-candidate",
      sources: ["https://www.openbible.info/geo/modern/m657590/tell-balatah"]
    }
  ],
  probabilityWeights: null,
  reviewRequiredBeforeRuntime: true
}
```

## Route example

```js
{
  id: "john4-samaria-route",
  routeConfidence: "reconstructed",
  geometry: null,
  geometryStatus: "not-yet-approved",
  claims: [
    {
      text: "Galileans used routes through Samaritan territory for festival travel to Jerusalem.",
      status: "sourced",
      source: "Josephus, Antiquities 20.118"
    }
  ],
  interpretiveNotes: [
    {
      text: "John 4:4 may imply narrative or theological necessity.",
      status: "debated-interpretation"
    }
  ]
}
```

## Why geometry is null in Round 0

The evidence foundation should not smuggle a guessed path into later rounds. Route geometry will be added only when Round 1/2 has reviewed ancient-road evidence, terrain constraints, and the distinction between a representative corridor and a defensible road reconstruction.
