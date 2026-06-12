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
      firstLine: 850 // ~1.5 cm
    },
    spacing: {
      body: {
        before: 0,
        after: 120, // 6pt
        line: 360,  // 1.5 lines or just proportional spacing, let's keep it simple
      },
      headingMain: {
        before: 0,
        after: 200
      },
      sectionHeading: {
        before: 240,
        after: 120
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
