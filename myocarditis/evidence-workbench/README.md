# Pediatric Myocarditis Evidence Workbench

A noindex, local-first React workspace for reviewing the pediatric myocarditis evidence registry.

## Current MVP

- Loads the existing `../question-bank/sources.json` registry.
- Separates pediatric anchor/evidence, mixed-population evidence, adult overlays, and mimic/differential sources with a controlled local override.
- Lets the reviewer attach a locally held PDF to each source.
- Stores PDF blobs in browser IndexedDB; PDFs are not committed to this repository.
- Renders PDFs with PDF.js.
- Supports page navigation and zoom.
- Supports persistent normalized-coordinate area highlights with four purposes: important, key, board, caution.
- Supports comments on annotations and jump-back-to-page behavior.
- Provides autosaving Markdown notes with a lightweight preview.
- Exports annotations, notes, and evidence-role overrides to versioned JSON. PDF bytes are deliberately excluded from export.
- Keyboard shortcuts: `H` highlight mode, `N` notes, `[` previous page, `]` next page, `Esc` cancel highlight.

## Evidence metadata rule

Bibliographic validity and evidentiary authority are separate. The tool does not rewrite the source citation when a reviewer changes an evidence-role classification. Overrides are stored separately so intermediate metadata can be corrected without corrupting source provenance.

## Storage

Browser database: `myocarditis-evidence-workbench`

Object stores:

- `pdfs`
- `annotations`
- `notes`
- `sourceOverrides`

This MVP is intentionally single-browser/local-first. Cloud sync, authentication, collaboration, AI generation, and PDF-file mutation are out of scope for the first pass.

## Next engineering slice

1. Add PDF text-layer selection and true text-anchored highlights.
2. Add atomic `claim` objects generated from annotations.
3. Link claims/annotations to existing question IDs in `stack-*.json`.
4. Add full-text local search across notes and annotation comments.
5. Add import/merge for exported workspace JSON with collision handling.
6. Add optional cloud repository adapter while preserving the local repository interface.
