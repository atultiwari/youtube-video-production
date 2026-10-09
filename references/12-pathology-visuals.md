# Pathology and medical pictures

For Pathology Notes and any medical explainer. Most of this is about where an image may come
from and what must be on it; the drawing itself follows 07-art-direction.md.

## Where images come from

In this order:

1. **Drawn schematics** with the kit, labelled "Simplified picture". The pilot used nothing
   else: a schematic can show the mechanism a micrograph only implies.
2. **Your own slides and photographs**, de-identified (below).
3. **Openly licensed sources**: Wikimedia Commons, Libre Pathology,
   papers under CC BY. Check the licence on the file's own page. CC BY-NC is out if the
   channel is monetised.

Never: atlas or textbook screenshots, images from a paywalled journal, images from a search
results page. Record **every** image in the validation file: source URL, author, licence, date
checked, and what was changed (cropped, recoloured, annotated).

Reference images looked at during research (step 3) are for looking: nothing from them ships
unless it is in that record.

## De-identification

v2's rule is "nothing private appears in any frame". For pathology that means, before an image
is placed:

- accession and case numbers, block and slide labels, barcodes;
- requisition text, patient names, dates of birth, hospital names on labels;
- the edge of a scanned slide, where the label often sits: crop it.

Look at the image at full resolution, not at the thumbnail. Metadata (EXIF, whole-slide image
headers) is stripped by re-encoding; check it is gone.

## On-screen conventions

| Always | Why |
|---|---|
| stain and magnification on every micrograph ("H&E, × 400") | a micrograph without them cannot be read |
| a scale bar where size matters | magnification alone depends on the screen |
| an arrow or ring on the exact feature, not the region | the v2 rule for app shots, applied to tissue |
| "Simplified picture" on every schematic | so a still cannot pass for a micrograph |
| numbers typeset, never drawn (cut-offs, sizes, counts) | a hand-drawn number reads as approximate |

## Claims

Pathology claims get the same primary-source rule as everything else (01-plan-and-validate.md),
with these sources first: WHO Classification of Tumours (the Blue Books), CAP cancer protocols,
the primary papers. Textbooks are secondary: cite one only when no better source is reachable,
and say so in the validation file. On the pilot, figures that rested on the textbook were
marked as "classic teaching values" on screen, and the narration said so.

## Whole-slide images

The `histolab` and `pathml` skills can extract tiles from whole-slide images. Treat a tile like
any other image: de-identify, license, label stain and magnification.
