---
license: apache-2.0
language:
- th
- en
tags:
- ocr
- thai
- onnx
- openvino
- text-recognition
- text-detection
pipeline_tag: image-to-text
---

<p align="center"><img src="https://huggingface.co/datasets/iapp/OpenThai2.0-model-card-assets/resolve/main/openthai-iapp-logos.png" alt="OpenThai · iApp Technology" width="460"></p>

# OpenThai2.0-OCR-Text · branch `v2.1`

> **You are on the `v2.1` branch (OpenThai2.1 OCR Text, now 2.1.4).** It uses the model files of v1.0.0 on `main` with a new runtime and, since 2.1.2, a second recognizer for loopless Thai fonts; since 2.1.3 it keeps single-digit table cells, and since 2.1.4 single-letter cells and decimal points. The runtime keeps the tone marks and vowels that float above the letters in old letterpress books, and it reads multi-column pages column by column. Load it with `revision="v2.1"`. `main` is unchanged.

**Fast Thai + English printed-text OCR that runs on a CPU.** It is the engine behind iApp Document OCR v3.0, released as open weights with its runtime, from OpenThai (formerly OpenThaiGPT). Developed by iApp, launched with AIEAT.

- **Detector:** PP-OCRv6-tiny (1.8 MB).
- **Recognizer:** a Thai CTC line recognizer trained by iApp (2.4 MB).
- **Runtime:** ONNX models on OpenVINO (or ONNX Runtime), CPU only. About 0.5 CPU-seconds per dense A4 page, roughly 950 pages a minute on 8 Xeon cores.

It reads a page image and returns its text in reading order, with a box and a confidence for every line. It does not write tables or Markdown; for that, see OpenThai2.0-OCR-Markdown.

**Step-by-step guide for Windows, Mac and Linux** (installing Python, reading pictures and PDFs, a ready script): [English](https://iapp.co.th/en/blog/openthai2p0-ocr-how-to-run) · [ภาษาไทย](https://iapp.co.th/blog/openthai2p0-ocr-how-to-run) · [中文](https://iapp.co.th/zh-CN/blog/openthai2p0-ocr-how-to-run)

## What is new in v2.1

**Thai old books keep their tone marks.** In letterpress books of the 1930s the tone marks and upper vowels float well above the consonants. The detector boxed each line without them and found the marks as separate small boxes, which were then dropped as junk, so the marks were never read. Black-and-white preprocessing could not bring them back. An outside tester found this on page 324 of a 1935 book (ตำหรับสายเยาวภา, archive.org `unset00002427`): v1.0.0 lost 128 of its 159 tone marks.

v2.1 attaches such mark boxes to their own line, grows the line's crop to take them in, and reads the line again:

| Test | v1.0.0 (`main`) | **v2.1** |
|---|---|---|
| The tester's page 324: character error rate | 21.5 % | **5.9 %** |
| Page 324: tone marks lost, of 159 | 128 | **23** |
| Page 324, the tester's six versions (original and five black-and-white treatments): error rate | 20.9–21.5 % | **5.2–6.2 %** |
| The whole 416-page book: words found in the Thai dictionary | 86.5 % | **93.2 %** |
| Old books (Wikisource, 200 test pages): accuracy | 77.1 | **78.8** |

A re-read never changes a digit, and on pages whose type does not float its marks it may change nothing but the marks, so receipts and tax IDs keep their numbers (400 synthetic receipt pages: no change on average; 600 real NECTEC receipts: field recall unchanged). All 22 robustness conditions still pass. Old-book pages take about 15–30 % longer, because their lines are read twice.

**Reading order:** v2.1 also reads two- and three-column pages column by column, including pages with a title or a footer across the columns. ThaiOCRBench full pages 82.0 → 83.8, SEA-DocBench Thai 54.1 → 55.5.

**2.1.1 (15 November 2026): lists keep their row order.** 2.1.0 sometimes took a list for two text columns. A Royal Gazette committee list ("๑. นาย… | นายกสมาคม") came out with every name first and every position after, so Royal Gazette fell from 96.3 to 96.1. 2.1.1 reads a gap as a list when the lines on both sides start alike: names, positions, "label : value", or numbers. Lists are then read row by row, and prose columns are still read column by column. Royal Gazette is back to 96.3; on the whole benchmark only the two affected pages changed.

**2.1.2 (16 November 2026): loopless Thai fonts.** Modern loopless faces (Kanit, Prompt, Sukhumvit Set) were sometimes read as Latin look-alikes: บ/ป as U, ร as S, ท as n, so "และผลกระทบ" came out as "lละพลNSะทU". A recognizer retrained on loopless fonts fixed that, but it read court scans worse. So 2.1.2 keeps the original recognizer and adds a second one (`rec2.onnx`, the same network trained with loopless fonts as well). A line is read again with it only when its first reading has Latin letters inside a Thai word, and the second reading is kept only if it has fewer of them. Lines without that sign, such as almost every court line, are never read twice.

| Test | 2.1.1 | **2.1.2** |
|---|---|---|
| Stray Latin letters, 12 pages in 4 fonts never trained on (Noto Sans/Serif Thai, Noto Sans Thai Looped, Anuphan) | 58 | **11** |
| Character error rate on those pages | 0.58 % | **0.33 %** |
| Stray Latin letters, Sukhumvit Set at 40 / 26 / 32 px scan | 14 / 20 / 5 | **1 / 2 / 0** |
| English and Thai+English lines, error rate (fonts never trained on / seen) | 3.06 / 3.19 % | **2.58 / 2.54 %** |
| ThaiOCRBench full pages, accuracy | 83.8 | **84.1** |
| 12-set printed average, accuracy | 88.2 | **88.3** |

Court judgments go from 96.88 to 96.84: margin date stamps that 2.1.1 read as "12 ก.H. 2560" now read "12 ก.ค. 2560" and are kept, and the test's reference text has no stamps. The 1935 book, receipts (field recall slightly up), Royal Gazette, budget documents and every other set are unchanged; all 22 robustness conditions pass. Not fixed: the sara am (ำ) of Thonburi at large sizes, which involves no Latin letters.

**2.1.3 (18 November 2026): single-digit table cells.** Users reported that a lone digit in a table cell disappeared: "กาแฟ 2 120.00" came out as "กาแฟ 120.00". The line filter drops every one-character line, because stamps and specks often read as a single character. 2.1.3 keeps a line made only of digits (Arabic or Thai) when its box is at least 0.62 of the page's normal line height. Real table digits measure 0.65–1.0 of it. The floating marks of old books that read as "9" or "๘" measure 0.2–0.6, so they are still dropped. The model files are unchanged; only the runtime and `config.json` change.

| Test | 2.1.2 | **2.1.3** |
|---|---|---|
| Receipt-style tables with single-digit quantities (20 generated pages), error rate | 9.94 % | **1.45 %** |
| 400 synthetic receipts, error rate | 7.73 % | **6.57 %** |
| 12-set printed average, accuracy | 88.3 | 88.3 |

Royal Gazette DocBench is slightly better (96.26 to 96.29). Court judgments (96.84 to 96.83) and old books (Wikisource, 80.59 to 80.56) change by a few hundredths, where a lone page or clause number that the reference text leaves out is now kept. The 1935 book and every other set are unchanged. All 24 robustness conditions pass, including two new ones for table cells.

**2.1.4 (19 November 2026): fixes from what users built on the model.** Projects using the model on GitHub reported, and worked around in their own code, these problems. 2.1.4 fixes them in the runtime; the model files are unchanged.
- **Single-letter cells:** timetable day codes (M T W H F S U) and units (g) in their own table cell were dropped. A one-letter Latin line now gets the same height-checked exception as a digit.
- **Decimal comma:** amounts such as "88,226,21" or "280,00" came out with a comma before the last two digits. They now get a decimal point ("88,226.21", "280.00"), only for a whole number token.
- **Paragraph breaks (optional):** `LineOCR(..., join={"paragraphs": True})` puts a blank line between rows further apart than one line height. It is off by default, so output does not change unless you ask.
- **Memory with ONNX Runtime** (macOS, Windows): the memory arena and patterns are off. Output is identical; with 8 threads the peak fell from 997 to 799 MB.
- **`requirements.txt`** with the versions the runtime was tested with.

| Test | 2.1.3 | **2.1.4** |
|---|---|---|
| Tables with one-letter cells (20 generated pages), error rate | 12.18 % | **7.44 %** |
| Receipt-style tables with decimal amounts, wrong decimal commas | 3 | **0** |
| 400 synthetic receipts, error rate | 6.57 % | **6.44 %** |
| 12-set printed average, accuracy | 88.3 | 88.3 |

Old books, court judgments and every other set are unchanged; the 1935 book is unchanged. Not in 2.1.4: a second detection pass for small text on large screenshots. It helped tiny print in our tests but did not change our screenshot test, so it stays off (`det.rescan_below`).

## Model at a glance

<table>
<tr><td><b>Parameters</b></td><td>1.60M in all: detector 428K (PP-OCRv6-tiny), recognizer 587K, second recognizer for loopless fonts 587K (2.1.2)</td></tr>
<tr><td><b>Files</b></td><td><code>det.onnx</code> 1.8 MB, <code>rec.onnx</code> 2.4 MB and <code>rec2.onnx</code> 2.4 MB, float32; OpenVINO runs them in bfloat16 on CPUs with AMX</td></tr>
<tr><td><b>Recognizer</b></td><td>CTC over text lines 48 pixels high; 530 output classes from a 528-character Thai and English dictionary</td></tr>
<tr><td><b>Output</b></td><td>the page's text in reading order, with a box and a confidence for every line</td></tr>
<tr><td><b>Languages</b></td><td>Thai and English, printed</td></tr>
<tr><td><b>Hardware</b></td><td>CPU only; no GPU needed</td></tr>
<tr><td><b>Speed</b></td><td>0.39 s per dense A4 page, one page at a time; 0.5 CPU-seconds a page, about 950 pages a minute on 8 Xeon cores</td></tr>
<tr><td><b>Memory</b></td><td>about 450 MB of RAM per worker process</td></tr>
<tr><td><b>Base</b></td><td>PaddlePaddle PP-OCRv6-tiny: the detector as shipped, the recognizer fine-tuned from it with a new Thai output layer</td></tr>
<tr><td><b>Training data</b></td><td>410,270 real text lines (court scans, parliament budget PDFs, Wikisource old books) and synthetic lines</td></tr>
<tr><td><b>Licence</b></td><td>Apache-2.0</td></tr>
<tr><td><b>Version</b></td><td>v2.1.4 (this branch), 19 November 2026: v1.0.0's model files, a new runtime and <code>rec2.onnx</code>; <code>main</code> holds v1.0.0</td></tr>
</table>

## How it compares

Every engine read the same pages and was scored the same way. The score is character accuracy, 100 × (1 − CER), so higher is better, against checked gold, after markup is stripped from both sides; reading order counts. A page an engine fails on counts as empty.

The 12 printed sets: parliament budget documents and Royal Gazette pages (each as a hand-verified set and as a larger set), SEA-DocBench Thai, Wikisource old books, Administrative Court judgments (50 documents), ThaiOCRBench full pages, th-docs-tables text-only pages, and three OCR104 sets (document crops, Thai+English crops, document photos). The table shows six of them, with handwriting, which is not in the average.

<!-- BEGIN accuracy -->
| Engine | Average, 12 printed sets | Court judgments | Royal Gazette | Budget (verified) | Old books | ThaiOCRBench | Handwriting |
|---|---|---|---|---|---|---|---|
| **OpenThai2.0-OCR-Text v2.1.1 (this branch)** | 88.2 | **97.0** | 96.3 | 99.6 | 78.8 | 83.8 | 10.3 |
| OpenThai2.0-OCR-Text v1.0.0 (`main`) | 87.8 | **97.0** | 96.3 | 99.5 | 77.1 | 82.0 | 10.3 |
| OpenThai2.0-OCR-Markdown (our page-to-Markdown model) | **90.3** | 96.2 | **98.0** | 98.2 | **79.7** | 90.6 | 78.9 |
| Typhoon OCR V2 2B | 89.6 | 96.2 | 94.6 | 97.3 | 77.2 | 87.3 | 76.7 |
| Typhoon OCR 1.5 2B | 87.5 | 92.4 | 92.5 | 97.2 | 78.6 | 71.4 | **94.5** |
| Gemini 2.5 Flash | 87.1 | 94.7 | 92.6 | 81.0 | 77.9 | 88.8 | 86.7 |
| dots.mocr | 86.4 | 96.3 | 93.1 | 99.5 | 76.3 | 78.8 | 39.4 |
| OneOCR (Microsoft, Windows) | 85.0 | 95.1 | 96.6 | **99.8** | 78.6 | 81.8 | 91.0 |
| Google Cloud Vision | 83.6 | 93.9 | 87.8 | 75.0 | 73.6 | 85.6 | 60.8 |
| PaddleOCR 3 PP-OCRv5 (th) | 81.1 | 90.4 | 82.9 | 93.1 | 55.5 | 75.8 | 41.6 |
| Qwen3.5-9B | 80.1 | 34.5 | 88.2 | 91.8 | 68.5 | 82.0 | 54.1 |
| NVIDIA Nemotron 3.5 Parse (default: boxes, classes, Markdown) | 89.0 | 96.9 | 92.2 | 98.9 | 76.9 | **92.0** | 57.3 |
| NVIDIA Nemotron 3.5 Parse (plain-text prompt) | 77.3 | 82.9 | 78.8 | 83.0 | 71.7 | 84.7 | 41.1 |
| Tesseract 5 (tha+eng) | 75.4 | 71.7 | 82.3 | 71.3 | 52.2 | 75.0 | 26.4 |
| PaddleOCR-VL 1.6 | 72.4 | 80.8 | 79.7 | 70.3 | 57.6 | 68.2 | 13.4 |
| DeepSeek-OCR-2 | 69.0 | 92.8 | 84.7 | 91.4 | 55.2 | 77.5 | 3.9 |

**Bold** marks the best score in each column. The average is over the 12 printed sets listed above the table; handwriting is not in it. Against Typhoon OCR V2 2B, the paired 95% interval of the 12-set average difference is −1.37 [−3.33, +0.21] for v2.1.1, against −1.79 [−3.69, −0.23] for v1.0.0. v2.1 was read on the same pages with the same scorer. The benchmark was read three times for this branch. The first version of the tone-mark change also altered digits on receipts and was fixed before the second read. A re-check of every dataset then found the list case, which was fixed as 2.1.1. The list rule was chosen on new synthetic dev pages, not on the benchmark (details in the release notes, `results/line-marks-20261115` in the source repository).
<!-- END accuracy -->

## Speed

<!-- BEGIN speed -->
| Engine | Runs on | Seconds per page | CPU seconds per page |
|---|---|---|---|
| **OpenThai2.0-OCR-Text (this model)** | CPU | **0.39** | **0.504** |
| OpenThai2.0-OCR-Markdown (our page-to-Markdown model) ‡ | GPU (H100) | 2.97 | — |
| Typhoon OCR V2 2B † | GPU (H100) | 1.00 | — |
| Typhoon OCR 1.5 2B | GPU (H100) | 2.79 | — |
| Gemini 2.5 Flash | API | 3.33 | — |
| dots.mocr | GPU (H100) | 4.78 | — |
| OneOCR (Microsoft, Windows) | CPU | 0.72 | 2.22 |
| Google Cloud Vision | API | 0.99 | — |
| PaddleOCR 3 PP-OCRv5 (th) | CPU | 15.20 | 16.291 |
| Qwen3.5-9B | GPU (H100) | 3.81 | — |
| NVIDIA Nemotron 3.5 Parse (default: boxes, classes, Markdown) ‡ | GPU (H100) | 3.04 | — |
| NVIDIA Nemotron 3.5 Parse (plain-text prompt) ‡ | GPU (H100) | 3.99 | — |
| Tesseract 5 (tha+eng) | CPU | 1.40 | 1.662 |
| PaddleOCR-VL 1.6 § | GPU (H100) | 1.71 | — |
| DeepSeek-OCR-2 | GPU (H100) | 1.81 | — |

**Bold** marks the fastest in each column.

One page at a time, the engine alone on its GPU or API. Most engines read the same 24 printed pages from the sets above. ‡ Nemotron 3.5 Parse and OpenThai2.0-OCR-Markdown: 24 court-judgment pages (full A4 pages of dense text). † Typhoon OCR V2 2B: the median of 12 th-docs-tables pages, re-measured on 13 November 2026 as its card recommends (vLLM 0.31 with CUDA graphs and its EAGLE-3 draft head; 1.60 s without the draft head). An earlier version of this card showed 16.72 s with `--enforce-eager`, which understated its speed. § PaddleOCR-VL 1.6: every sample page, one at a time. CPU seconds are one single-threaded worker on an Intel Xeon 8468 core; at 0.504 CPU seconds a page, this model reads about 950 pages a minute on 8 cores. On shorter pages the GPU models are faster: OpenThai2.0-OCR-Markdown's own card gives 1.5 s a page, the median of 12 table pages.
<!-- END speed -->

## Use

The guide above walks through installation on Windows, Mac and Linux, with a script for pictures and PDFs: [English](https://iapp.co.th/en/blog/openthai2p0-ocr-how-to-run) · [ภาษาไทย](https://iapp.co.th/blog/openthai2p0-ocr-how-to-run) · [中文](https://iapp.co.th/zh-CN/blog/openthai2p0-ocr-how-to-run). The minimal use:

```python
# huggingface_hub.snapshot_download("iapp/OpenThai2.0-OCR-Text", revision="v2.1", local_dir="OpenThai2.0-OCR-Text")
from runtime.line_engine import LineOCR      # needs openvino (or onnxruntime), opencv-python-headless, pyclipper, numpy

ocr = LineOCR(".", threads=1)                # this folder: det.onnx, rec.onnx, rec2.onnx, rec_dict.txt, config.json
r = ocr.read("page.png")                     # path, bytes, BGR ndarray or PIL image
print(r["text"])                             # lines in reading order (columns one after another)
r["lines"]                                   # [{"text", "confidence", "row", "box"}]; boxes in the input image's coordinates
r["rotation"], r["text_angle"]               # quarter turns applied (0/90/180/270) and the page's text angle in degrees
```

**For throughput, run one worker process per core with `threads=1`.** Threads in one process stop scaling at about 2 cores, because the Python parts hold the GIL.

## What the runtime handles

- **Page orientation from the text itself:** sideways and upside-down pages are turned the way their lines read best.
- **Deskew** above 2.5°, then a second detection; boxes come back in the caller's coordinates.
- **Reading order:** two- and three-column pages are read column by column; tables, budget pages, lists numbered across the row and lists whose lines start alike (names | positions, label : value) stay in row order.
- **Colour:** each column's background is subtracted, so light-on-dark text, coloured slides and gradients read.
- **Floating marks (v2.1):** tone marks and vowels that the detector boxed apart from their line (old letterpress type) are put back into the line, which is read again; only marks may change, never a digit.
- **Loopless fonts (2.1.2):** a line read with Latin letters inside a Thai word is read again with `rec2.onnx`, and that reading is kept if it has fewer of them.
- **Single-digit cells (2.1.3):** a line made only of digits may be one character long when its box is at least 0.62 of the page's line height, so a quantity "2" in a table is kept.
- **Single-letter cells and decimal points (2.1.4):** the same exception for one Latin letter; "280,00" becomes "280.00".
- **Paragraph breaks (2.1.4, optional):** `join={"paragraphs": True}`.
- **Clean-up:** detached-mark fragments are dropped, lines merged across a gutter are split, and Thai/Latin look-alikes are fixed (a lone W glued to Thai becomes พ).

Robustness suite: 26 generated conditions (rotation, tilt, huge and tiny text, colour, faded print, photocopy noise, phone photos, tables, short-word, single-digit and single-letter table cells, UI screenshots, columns), 20 held-out pages each, bars fixed before the first run. **25 pass;** single-letter table cells (new in 2.1.4) is at 7.4 % against its 3 % bar, down from 12.2 % in 2.1.3.

## Files

| File | What |
|---|---|
| `det.onnx`, `det.yml` | Text-line detector: PaddlePaddle PP-OCRv6-tiny, Apache-2.0, as shipped |
| `rec.onnx`, `rec_dict.txt` | Thai CTC line recognizer. Input `[N, 3, 48, W]`; output softmax `[N, W/8, 530]` |
| `rec2.onnx` | Second recognizer (2.1.2): the same network and dictionary, trained with loopless Thai fonts as well (rec-tiny-v9); used only for re-reads |
| `config.json` | Line filter (`drop_below 0.8, junk_below 0.9, junk_invalid 0.05, min_chars 2`; a digits-only line needs 1 character if its box is at least 0.62 of the line height: `min_chars_digits 1, min_chars_digits_height 0.62`), crop handling (`color: flatten`) and `rec2` (`file: rec2.onnx`; remove it to turn the re-read off); 2.1.4: `min_chars_latin`, `decimal_comma`, `ort_low_memory` |
| `pytorch/rec_weights.pt` | Recognizer weights for further training (transformers `PPOCRV6TinyRecForTextRecognition`, classifier replaced) |
| `runtime/line_engine.py`, `runtime/thai_norm.py` | The runtime |
| `requirements.txt` | The Python packages the runtime needs, with the versions it was tested with (2.1.4) |

**Porting the runtime** (to a browser, JavaScript, Go and so on): much of the accuracy comes from the runtime around the two networks. Keep these steps, or results drop:
- Thai normalisation (`thai_norm.canonical`) and the look-alike fixes (`fix_scripts`);
- page orientation and deskew, each followed by a second detection;
- the line splitting at wide gaps (`split_gap`) and the column and list logic in `reading_order`;
- the floating-mark attachment, the line filter with the settings in `config.json`, and the `rec2.onnx` re-read.

Pin a revision (`revision="v2.1"` or a commit) so an update cannot change your output unnoticed.

## Training

The recognizer starts from the PP-OCRv6-tiny recognizer (Apache-2.0) with a new Thai output layer, fine-tuned with CTC on:

- **synthetic Thai/English lines** rendered on the fly from 85 OFL/TLWG fonts plus 29 bold weights, with court-text, dictionary, numeric and field strings, English from wikitext, short labels and cross-script look-alike drills;
- **261,877 Administrative Court scan lines,** labelled with the court's own DOC text;
- **41,101 parliament budget-PDF lines,** text-layer labels kept only where the recognizer independently agrees;
- **107,292 Wikisource old-book lines** (level-3 pages; the level-4 pages are a test set).

No OneOCR output and no Gemini labels were used, no personal-data sets, and every benchmark document is excluded by document.

## Acknowledgements

The recognizer was trained on NVIDIA H100 GPUs provided by Siam AI. The detector and the recognizer's starting point are PaddlePaddle's PP-OCRv6-tiny.

## Limitations

- **Printed text only.** Handwriting and scene text are weak (see the table); use a VLM for those.
- **Decorative display fonts:** short labels in heavily stylised fonts can be misread. Loopless fonts can still swap Thai letters (ท for า), and Thonburi's sara am at large sizes is misread.
- **Stamps and seals come out as text,** as they are text on the page.
- **Court judgments are in-domain:** court scans (other documents than the 150 tested) are in the training data.
- **The bf16 speed needs AMX** (Sapphire Rapids or later); OpenVINO falls back to fp32 on other CPUs.

PP-OCRv6 models © PaddlePaddle authors, Apache-2.0; see `NOTICE`.
