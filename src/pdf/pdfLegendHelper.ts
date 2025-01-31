import {
  CircleLegendRow,
  FillLegendRow,
  IconLegendRow,
  ImageLegendItem,
  LegendType,
  RegularShapeLegendRow,
  StrokeLegendRow,
  StyleLegendItem,
  StyleRowType,
} from '@vcmap/ui';
import { ColorType, getShapeFromOptions, parseColor } from '@vcmap/core';
import { getLogger } from '@vcsuite/logger';
import jsPDF from 'jspdf';
import PDFCreator, {
  Coords,
  ElementPlacement,
  LegendEntries,
  Size,
} from './pdfCreator.js';
import { PageStyle } from './styles.js';
import { svgToPng } from '../common/util.js';
import { name } from '../../package.json';

/**
 * @param src The src of the image to be created.
 * @param maxHeight Optional - the maximum height of the image, for SVG files. If not set, the natural height of the image will be used.
 * @returns The created image, or undefined if the SVG conversion fails.
 */
async function createImage(
  src: string,
  maxHeight?: number,
): Promise<HTMLImageElement | undefined> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  let svgSrc;
  // .svg file extension, <svg tag OR image/svg as in base64 encoded svg files.
  if (/([.<]|%3C)svg/gi.test(src) || /image\/svg/i.test(src)) {
    svgSrc = await svgToPng(
      src,
      maxHeight ? maxHeight * PDFCreator.JSPDF_PPI : undefined,
    ).catch((e) => {
      getLogger(name).warning(
        `An error occured while converting SVG to PNG: ${e}`,
      );
      return undefined;
    });
    if (!svgSrc) {
      return undefined;
    }
  }
  img.src = svgSrc ?? src;
  await img.decode();
  return img;
}

/**
 * Resizes the image to fit in the max dimensions of the passed geometry,
 * adds the image to the PDF and returns the height of the image.
 * @param pdfDoc The jsPDF instance.
 * @param img The image to resize and print.
 * @param placement The image placement.
 * @param centerY Whether to center on the Y-axis.
 * @returns The printed image height.
 */
function sizeAndPrintImage(
  pdfDoc: jsPDF,
  img: HTMLImageElement,
  placement: ElementPlacement,
  centerY = false,
): number {
  const { naturalHeight, naturalWidth } = img;
  const imgNatHeight = naturalHeight / PDFCreator.JSPDF_PPI;
  const imgNatWidth = naturalWidth / PDFCreator.JSPDF_PPI;
  const imageRatio = naturalHeight / naturalWidth;
  const { height: maxH, width: maxW } = placement.size;
  const dimensionsRatio = maxH / maxW;

  let height = imgNatHeight;
  let width = imgNatWidth;
  let { x, y } = placement.coords;
  if (imageRatio <= dimensionsRatio && imgNatWidth >= maxW) {
    // img needs to be resided depending on width
    height *= maxW / width;
    ({ width } = placement.size);
  } else if (imgNatHeight >= maxH) {
    // img needs to be resized depending on height
    width *= maxH / height;
    ({ height } = placement.size);
  }
  x = placement.coords.x + (maxW - width) / 2;
  if (centerY) {
    y = placement.coords.y + (maxH - height) / 2;
  }
  pdfDoc.addImage(img.src, 'PNG', x, y, width, height);
  return height;
}

function setStrokeColor(pdfDoc: jsPDF, color?: ColorType): void {
  const parsedColor = parseColor(color, [0, 0, 0]);
  if (typeof parsedColor === 'string' || typeof parsedColor === 'number') {
    pdfDoc.setDrawColor(parsedColor);
  } else if (Array.isArray(parsedColor) && parsedColor.length >= 3) {
    pdfDoc.setDrawColor(parsedColor[0], parsedColor[1], parsedColor[2]);
  } else {
    pdfDoc.setDrawColor(0, 0, 0);
  }
}

function setFillColor(pdfDoc: jsPDF, color?: ColorType): void {
  const parsedColor = parseColor(color, [255, 255, 255]);
  if (typeof parsedColor === 'string' || typeof parsedColor === 'number') {
    pdfDoc.setFillColor(parsedColor);
  } else if (Array.isArray(parsedColor) && parsedColor.length >= 3) {
    pdfDoc.setFillColor(parsedColor[0], parsedColor[1], parsedColor[2]);
  } else {
    pdfDoc.setFillColor(255, 255, 255);
  }
}

/**
 * Adds the rows of the StyleLegend item to the PDF, ensuring jump to next page when required.
 * @param styleItem The StyleLegend item to render.
 * @param pdfDoc The jsPdf document.
 * @param nextPage A callback to jump to the next page.
 * @param currentPlacement
 * @param originY
 * @returns The height of the StyleLegend on the PDF.
 */
async function renderStyleLegend(
  styleItem: StyleLegendItem,
  pdfDoc: jsPDF,
  nextPage: () => void,
  currentPlacement: ElementPlacement,
  originY: number,
): Promise<number> {
  const { coords: currentPos, size: currentSize } = currentPlacement;
  const cols = styleItem.colNr ?? 2;
  const initialPos = { ...currentPos };
  /** The graphic part size of a row item. */
  const itemSize = { width: 0.4, height: 0.2 };
  /** The margin added between graphic part and title of a row, and between two rows. */
  const margin = 0.1;
  const maxTotalWidth = (currentSize.width - (cols - 1) * margin) / cols;
  const titleMaxWidth = maxTotalWidth - margin - itemSize.width;

  let { x, y } = currentPos;
  let idx = -1;
  for await (const row of styleItem.rows) {
    // Set default line width
    pdfDoc.setLineWidth(0.005);

    idx += 1;
    /** The item style: either Stroke, Filled or both (FD) */
    let style: 'S' | 'F' | 'FD' = 'F';
    x = idx % cols ? x + (idx % cols) * maxTotalWidth : initialPos.x;
    y = initialPos.y + Math.floor(idx / cols) * (itemSize.height + margin);

    if (y - originY >= currentSize.height - itemSize.height) {
      idx = 0;
      nextPage();
      ({ x, y } = currentPos);
      initialPos.x = currentPos.x;
    }

    // Sets the style for each row.
    if (Object.hasOwn(row, 'stroke')) {
      const { stroke } = row as StrokeLegendRow;
      if (stroke) {
        setStrokeColor(pdfDoc, stroke.color);
        style += 'D';
        if (stroke.width) {
          pdfDoc.setLineWidth(stroke.width / PDFCreator.JSPDF_PPI);
        }
      }
    }
    if (Object.hasOwn(row, 'fill')) {
      const { fill } = row as FillLegendRow;
      if (fill) {
        setFillColor(pdfDoc, fill.color as number[]);
      } else {
        style = 'S';
      }
    }

    // Item rendering
    if (row.type === StyleRowType.Stroke) {
      pdfDoc.line(
        x,
        y + itemSize.height / 2,
        x + itemSize.width,
        y + itemSize.height / 2,
      );
    } else if (row.type === StyleRowType.Fill) {
      pdfDoc.rect(x, y, itemSize.width, itemSize.height, style);
    } else if (row.type === StyleRowType.Circle) {
      const legend = row as CircleLegendRow;
      setStrokeColor(
        pdfDoc,
        (legend.image.stroke as { color?: number[] })?.color,
      );
      const { width } = legend.image.stroke as { width?: number };
      if (width) {
        pdfDoc.setLineWidth(width / PDFCreator.JSPDF_PPI);
      }
      setFillColor(pdfDoc, (legend.image.fill as { color?: number[] })?.color);
      const radius = Math.min(
        itemSize.height / 2,
        legend.image.radius / PDFCreator.JSPDF_PPI,
      );
      pdfDoc.circle(
        x + itemSize.width / 2,
        y + itemSize.height / 2,
        radius,
        'FD',
      );
    } else if (row.type === StyleRowType.Icon) {
      const legend = row as IconLegendRow;
      if (legend.image.src) {
        const placement = { coords: { x, y }, size: { ...itemSize } };
        await createImage(legend.image.src, itemSize.height).then((img) => {
          if (img) {
            sizeAndPrintImage(pdfDoc, img, placement, true);
          }
        });
      }
    } else if (row.type === StyleRowType.Shape) {
      const { image } = row as RegularShapeLegendRow;
      const shape = getShapeFromOptions(image);
      const imageRep = shape.getImage(1);
      const src = imageRep.toDataURL();
      const placement = { coords: { x, y }, size: { ...itemSize } };
      await createImage(src, itemSize.height).then((img) => {
        if (img) {
          sizeAndPrintImage(pdfDoc, img, placement, true);
        }
      });
    } else if (row.type === StyleRowType.Text) {
      // XXX waiting for it to be necessary to investigate how to handle it.
      getLogger(name).warning(
        `Legend items of type ${StyleRowType.Text} are not yet supported and will be omitted.`,
      );
    }

    // Adds the row title next to its graphic part. Wrap it to the max available width.
    const wrappedTitle = pdfDoc.splitTextToSize(row.title, titleMaxWidth);
    const title = `${wrappedTitle[0]}${wrappedTitle.length > 1 ? ' ...' : ''}`;
    pdfDoc.text(title, x + itemSize.width + margin, y + itemSize.height / 2, {
      baseline: 'middle',
    });
  }
  return Math.ceil(idx / cols) * (itemSize.height + margin);
}

/**
 * @param pdfDoc The jsPdf document.
 * @param config The initial config.
 * @param totalHeight The total height of the page.
 */
function drawSeparatingLine(
  pdfDoc: jsPDF,
  config: { origin: Coords; size: Size },
  totalHeight: number,
): void {
  pdfDoc.setLineWidth(0.01);
  setStrokeColor(pdfDoc, [0, 0, 0]);
  pdfDoc.line(
    config.size.width / 2,
    config.origin.y,
    config.size.width / 2,
    config.origin.y + totalHeight,
  );
}

/**
 * Adds the Legend Entries to the PDF.
 * @param pdfDoc The jsPdf document..
 * @param formatting The PDFCreator formatting.
 * @param legendItems The Legend Entries of a layer to be added.
 * @param addLegendPage A callback used to add a new page.
 * @param config The configuration of the Legend pages: top-left coords, size and whether to create two columns.
 */
// eslint-disable-next-line import/prefer-default-export
export async function addLayerLegend(
  pdfDoc: jsPDF,
  formatting: PageStyle,
  legendItems: LegendEntries,
  addLegendPage: () => number,
  config: {
    origin: Coords;
    size: Size;
    useColumns: boolean;
  },
): Promise<void> {
  const { elementMargin, pageMargins } = formatting;
  const dimensions: Size = {
    height: config.size.height - config.origin.y - pageMargins[2],
    width: config.useColumns
      ? config.size.width / 2 - pageMargins[1] - pageMargins[3]
      : config.size.width - pageMargins[1] - pageMargins[3],
  };

  /** The current side of the PDF being printed, when in `landscape` mode. */
  let lsSide: 'left' | 'right' = 'left';
  const currentPos = { ...config.origin };
  const currentSize = { ...dimensions };

  /** Initializes the `currentSize` and `currentPos` values, and adds a vertical line when using columns. */
  function initSizeAndPosition(): void {
    currentPos.x = config.origin.x;
    currentPos.y = config.origin.y;
    if (config.useColumns) {
      drawSeparatingLine(pdfDoc, config, dimensions.height);
    }
  }
  initSizeAndPosition();

  /**
   * Updates the `currentSize` and `currentPos` values, by adding the element height and a margin.
   * @param elementHeight The height of the added element.
   */
  function updateSizeAndPosition(elementHeight: number): void {
    currentSize.height -= elementHeight + elementMargin;
    currentPos.y += elementHeight + elementMargin;
  }

  /**
   * Handles the next page, by adding a new one to the PDF or switching to the right side when using columns.
   */
  function nextPage(): void {
    currentSize.height = dimensions.height;
    currentSize.width = dimensions.width;
    lsSide = lsSide === 'left' ? 'right' : 'left';
    if (config.useColumns && lsSide === 'right') {
      currentPos.x = config.origin.x + config.size.width / 2;
      currentPos.y = config.origin.y;
    } else {
      addLegendPage();
      initSizeAndPosition();
    }
  }

  for await (const legendItem of legendItems) {
    if (currentSize.height <= 0) {
      nextPage();
    }
    const currentPlacement = { coords: currentPos, size: currentSize };
    if (legendItem.type === LegendType.Style) {
      await renderStyleLegend(
        legendItem as StyleLegendItem,
        pdfDoc,
        nextPage,
        currentPlacement,
        config.origin.y,
      ).then(updateSizeAndPosition);
    } else if (legendItem.type === LegendType.Image) {
      const { src } = legendItem as ImageLegendItem;
      await createImage(src)
        .then((img) => {
          if (img) {
            const { naturalHeight: imgH } = img;
            // Ensures the image will not be smaller than 80% of its naturalHeight, or jump to next page otherwise if more than a third of the height is already filled.
            if (
              (imgH / PDFCreator.JSPDF_PPI) * 0.8 > currentSize.height &&
              currentPos.y - config.origin.y > dimensions.height / 3
            ) {
              nextPage();
            }
            const placement = {
              size: { ...currentSize },
              coords: { ...currentPos },
            };
            return sizeAndPrintImage(pdfDoc, img, placement);
          }
          return 0;
        })
        .then(updateSizeAndPosition);
    } else {
      throw new Error(`${legendItem.type} is not supported`);
    }
  }
}
