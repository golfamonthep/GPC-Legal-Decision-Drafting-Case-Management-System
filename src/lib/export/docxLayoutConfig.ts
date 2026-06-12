export const docxLayoutConfig = {
  page: {
    margins: {
      top: 1417,    // 2.5 cm = ~1417 twips
      bottom: 1134, // 2.0 cm = ~1134 twips
      left: 1701,   // 3.0 cm = ~1701 twips
      right: 1134,  // 2.0 cm = ~1134 twips
    }
  },
  font: {
    family: "TH Sarabun New",
    sizes: {
      body: 32,         // 16pt (half-points)
      heading: 36,      // 18pt
      sectionHeading: 32 // 16pt (using 16pt bold for section headings per requirements, wait requirement says 16 pt bold for section headings, 18 pt bold for main heading)
    }
  },
  paragraph: {
    indent: {
      firstLine: 709 // ~1.25 cm
    },
    spacing: {
      body: {
        before: 0,
        after: 100, // 5pt, small but not excessive
        line: 276,  // Multiple 1.15 line spacing ~ 276 twips (240 is single)
      },
      headingMain: {
        before: 0,
        after: 240 // Moderate gap before case numbers
      },
      sectionHeading: {
        before: 240, // Moderate gap before new section
        after: 80    // Small gap after heading
      },
      partyBlock: {
        after: 120
      },
      signature: {
        beforeRole: 120,
        beforeNewSignature: 600,
        afterRole: 400
      }
    }
  }
};
