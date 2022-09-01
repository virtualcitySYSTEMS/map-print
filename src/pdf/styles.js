/**
 * The font weight used by the pdfCreator
 * @enum {number}
 */
export const FontWeights = {
  BOLD: 700,
  REGULAR: 400,
};

export const pageStyles = {
  default: {
    // margin of page in inches
    pageMargins: [0.4, 0.4, 0.4, 0.4],
    // margin between elements in inches
    elementMargin: 0.4,
    // factor for scaling logo compared to lineheight of title
    'logo.scale': 1.2,
    'title.fontWeight': FontWeights.BOLD,
    'title.fontSize': 20,
    // the portion of total printable line width (excluding page margins)
    'title.widthPortion.portrait': 0.5,
    'title.widthPortion.landscape': 0.75,
    // max line count, other lines are not printed
    'title.maxLineCount.portrait': 2,
    'title.maxLineCount.landscape': 1,
    'description.fontWeight': FontWeights.REGULAR,
    'description.fontSize': 11,
    'description.lineHeight': 1.25,
    'description.maxLineCount.portrait': 15,
    'description.maxLineCount.landscape': 8,
    // contact and image information
    'info.fontWeight': FontWeights.REGULAR,
    'info.fontSize': 10,
    'info.widthPortion.portrait': 0.5,
    'info.widthPortion.landscape': 0.25,
  },
  // format dependent changes. Format needs to be written like in standardPageSizes.js
  A5: {
    elementMargin: 0.3,
    'description.fontSize': 8,
    'description.lineHeight': 1.15,
    'info.fontSize': 8,
    'info.widthPortion.landscape': 0.3,
    'title.fontSize': 14,
  },
};
