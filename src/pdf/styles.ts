/* eslint-disable @typescript-eslint/naming-convention */
/** The font weight used by the pdfCreator */
export const fontWeights = {
  BOLD: 700,
  REGULAR: 400,
};
export type PageStyle = {
  pageMargins: number[];
  elementMargin: number;
  'logo.scale': number;
  'title.fontWeight': number;
  'title.fontSize': number;
  'title.widthPortion.portrait': number;
  'title.widthPortion.landscape': number;
  'title.maxLineCount.portrait': number;
  'title.maxLineCount.landscape': number;
  'description.fontWeight': number;
  'description.fontSize': number;
  'description.lineHeight': number;
  'description.maxLineCount.portrait': number;
  'description.maxLineCount.landscape': number;
  'info.fontWeight': number;
  'info.fontSize': number;
  'info.widthPortion.portrait': number;
  'info.widthPortion.landscape': number;
};

export const pageStyles: { default: PageStyle; A5: Partial<PageStyle> } = {
  default: {
    // margin of page in inches
    pageMargins: [0.4, 0.4, 0.4, 0.4],
    // margin between elements in inches
    elementMargin: 0.4,
    // factor for scaling logo compared to lineheight of title
    'logo.scale': 1.2,
    'title.fontWeight': fontWeights.BOLD,
    'title.fontSize': 20,
    // the portion of total printable line width (excluding page margins)
    'title.widthPortion.portrait': 0.5,
    'title.widthPortion.landscape': 0.75,
    // max line count, other lines are not printed
    'title.maxLineCount.portrait': 2,
    'title.maxLineCount.landscape': 1,
    'description.fontWeight': fontWeights.REGULAR,
    'description.fontSize': 11,
    'description.lineHeight': 1.25,
    'description.maxLineCount.portrait': 15,
    'description.maxLineCount.landscape': 8,
    // contact and image information
    'info.fontWeight': fontWeights.REGULAR,
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
