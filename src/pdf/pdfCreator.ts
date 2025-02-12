import { LegendItem } from '@vcmap/ui';
import { jsPDF } from 'jspdf';
import pageSizes from './standardPageSizes.js';
import { pageStyles, FontWeights, PageStyle } from './styles.js';
import {
  contactKeysPattern,
  LegendOrientationOptions,
  OrientationOptions,
} from '../common/configManager.js';
import getDefaultOptions from '../defaultOptions.js';
import { addLayerLegend } from './pdfLegendHelper.js';

/** 2D coordinates. Origin is upper left corner. */
export type Coords = {
  x: number;
  y: number;
};

/** Dimension of Element */
export type Size = {
  width: number;
  height: number;
};

export type ElementPlacement = {
  /**  Coordinates of upper left corner in inches. Origin is upper left corner of pdf document. */
  coords: Coords;
  /** width and height */
  size: Size;
};

export type TextWithHeader = {
  header: string;
  text: Array<string>;
};

export type PrintableLegendItems = Array<{
  title: string;
  legends: Array<LegendItem>;
}>;

type Legend = {
  config: {
    format: keyof typeof pageSizes;
    orientation:
      | LegendOrientationOptions.LANDSCAPE
      | LegendOrientationOptions.PORTRAIT;
  };
  items: PrintableLegendItems;
};

type PDFCreatorOptions = {
  /** The orientation of the PDF. */
  orientation: OrientationOptions.LANDSCAPE | OrientationOptions.PORTRAIT;
  /** The format of the PDF. */
  format: keyof typeof pageSizes;
  /** The title at the beginning of the PDF. */
  title?: string;
  /** The map logo. */
  logo?: HTMLImageElement;
  /** The aspect ratio of the input image. */
  imgRatio: number;
  /** The description below the image. */
  description?: string;
  /** The contact information in the lower left corner. */
  contact?: TextWithHeader;
  /** Information about the map content. */
  mapInfo?: TextWithHeader;
  /** Information about the copyright. */
  copyright?: string;
  /** Information about the legend. */
  legend?: Legend;
  /** Paths to bold and regular weight for named font. */
  fonts?: { name: string; bold: string; regular: string };
};

const defaultOptions = getDefaultOptions();

export default class PDFCreator {
  /** PPI of JSPDF for calculaing e.g. fontsize */
  static JSPDF_PPI = 72;

  initialized = false;

  // eslint-disable-next-line new-cap
  pdfDoc = new jsPDF(
    defaultOptions.orientationDefault,
    'in',
    defaultOptions.formatDefault,
  );

  formatting = pageStyles.default;

  /** Size of PDF depending on input format. */
  pdfSize: Size =
    defaultOptions.orientationDefault === OrientationOptions.PORTRAIT
      ? {
          width: pageSizes[defaultOptions.formatDefault][0],
          height: pageSizes[defaultOptions.formatDefault][1],
        }
      : {
          width: pageSizes[defaultOptions.formatDefault][1],
          height: pageSizes[defaultOptions.formatDefault][0],
        };

  /** The line width where content can be added (excluding margins). */
  maxLineWidth =
    this.pdfSize.width -
    this.formatting.pageMargins[1] -
    this.formatting.pageMargins[3];

  font = 'helvetica';

  /** The orientation of the pdf. */
  orientation: OrientationOptions.LANDSCAPE | OrientationOptions.PORTRAIT =
    defaultOptions.orientationDefault;

  /**
   * The title string of the pdf splitted according to line length.
   * Each element of array is new line.
   * If title is longer than maxLineCount defined in styles.js it is shortend.
   * 'undefined' if no input title available.
   */
  title?: Array<string>;

  /** Position and dimensions of the title. */
  titlePlacement?: ElementPlacement;

  /** The navbar logo from the map which is printed in the upper right corner. */
  logo?: HTMLImageElement;

  /** Position and dimensions of the logo. */
  logoPlacement?: ElementPlacement;

  /** Contact information already splitted by configManager. */
  contact?: TextWithHeader;

  /** Position and dimensions of the contact information. */
  contactPlacement?: ElementPlacement;

  /** Map info provided by mapInfoCollector. */
  mapInfo?: TextWithHeader;

  /** Position and dimensions of the map information. */
  mapInfoPlacement?: ElementPlacement;

  /**
   * The description string of the pdf splitted according to line length.
   * Each element of array is new line.
   * If description is longer than maxLineCount defined in styles.js it is shortend.
   * `undefined` if no input description available.
   */
  description?: Array<string>;

  /** Position and dimensions of the description. */
  descriptionPlacement?: ElementPlacement;

  /** Position and dimensions of the image. */
  imgPlacement: ElementPlacement | undefined;

  /** Unique copyright from all active layers. */
  copyright?: string;

  /** Position and dimensions of the copyright. */
  copyrightPlacement?: ElementPlacement;

  /** Legend config and items. */
  legend?: Legend;

  /** The current layer for which a legend page is being added */
  currentLayerTitle?: string;

  /**
   * Calculates the positioning of the elements to be placed on the PDF.
   * @param pdfCreatorOptions The params for PDFCreator setup wrapped in an object.
   */
  async setup(pdfCreatorOptions: PDFCreatorOptions): Promise<void> {
    if (pdfCreatorOptions.format !== defaultOptions.formatDefault) {
      this.formatting = Object.assign(
        pageStyles.default,
        pageStyles[pdfCreatorOptions.format as keyof typeof pageStyles],
      );
    }
    if (
      pdfCreatorOptions.format !== defaultOptions.formatDefault ||
      pdfCreatorOptions.orientation !== defaultOptions.orientationDefault
    ) {
      const format = pdfCreatorOptions.format as keyof typeof pageSizes;
      this.pdfSize =
        pdfCreatorOptions.orientation === OrientationOptions.PORTRAIT
          ? { width: pageSizes[format][0], height: pageSizes[format][1] }
          : { width: pageSizes[format][1], height: pageSizes[format][0] };

      this.maxLineWidth =
        this.pdfSize.width -
        this.formatting.pageMargins[1] -
        this.formatting.pageMargins[3];

      /** the jsPDF instance for creating the PDF and adding content. */
      // eslint-disable-next-line new-cap
      this.pdfDoc = new jsPDF(
        pdfCreatorOptions.orientation,
        'in',
        pdfCreatorOptions.format,
      );
    }

    if (pdfCreatorOptions.fonts) {
      this.font = await this._addFonts(pdfCreatorOptions.fonts);
    }

    if (pdfCreatorOptions.orientation !== defaultOptions.orientationDefault) {
      this.orientation = pdfCreatorOptions.orientation;
    }

    if (pdfCreatorOptions.title) {
      const width = this._calcElementWidth(
        this.formatting[`title.widthPortion.${pdfCreatorOptions.orientation}`],
      );
      const maxLineCount =
        this.formatting[`title.maxLineCount.${this.orientation}`];

      this._setTextStyle('title');
      const titleArray: Array<string> = this.pdfDoc.splitTextToSize(
        pdfCreatorOptions.title,
        width,
      );
      this.title = titleArray.slice(0, maxLineCount);
      this.titlePlacement = this._calcTitlePlacement(
        this.title,
        width,
        maxLineCount,
      );
    }

    if (pdfCreatorOptions.logo) {
      this._setTextStyle('title');
      this.logo = pdfCreatorOptions.logo;
      this.logoPlacement = this._calcLogoPlacement(this.logo);
    }

    if (pdfCreatorOptions.contact) {
      this._setTextStyle('info');
      this.contact = pdfCreatorOptions.contact;
      this.contactPlacement = this._calcContactPlacement();
    }

    if (pdfCreatorOptions.mapInfo) {
      this._setTextStyle('info');
      this.mapInfo = pdfCreatorOptions.mapInfo;
      this.mapInfoPlacement = this._calcMapInfoPlacement();
    }

    if (pdfCreatorOptions.description) {
      /** width of discription text field */
      let width = this.maxLineWidth;
      if (pdfCreatorOptions.orientation === OrientationOptions.LANDSCAPE) {
        if (this.contact && this.mapInfo) {
          // both info elems
          width *= 1 - 2 * this.formatting['info.widthPortion.landscape'];
        } else if (!this.contact !== !this.mapInfo) {
          // xor -> only one
          width *= 1 - this.formatting['info.widthPortion.landscape'];
        }
      }
      const maxLineCount =
        this.formatting[`description.maxLineCount.${this.orientation}`];

      this._setTextStyle('description');
      const descriptionArray: Array<string> = this.pdfDoc.splitTextToSize(
        pdfCreatorOptions.description,
        width,
      );
      this.description = descriptionArray.slice(0, maxLineCount);
      this.descriptionPlacement = this._calcDescriptionPlacement(
        this.description,
        width,
      );
    }

    this.imgPlacement = this._calcImagePlacement(pdfCreatorOptions.imgRatio);

    if (pdfCreatorOptions.copyright) {
      this._setTextStyle('info');
      this.copyright = pdfCreatorOptions.copyright;
      this.copyrightPlacement = this._calcCopyrightPlacement(
        pdfCreatorOptions.copyright,
      );
    }

    if (pdfCreatorOptions.legend) {
      this.legend = pdfCreatorOptions.legend;
    }

    this.initialized = true;
  }

  /**
   * Sets text style globally on {@link jsPDF} instance of {@link PDFCreator}.
   * @param textElement Name of a text element with font size and style declared.
   * @example 'description'
   */
  private _setTextStyle(textElement: string): void {
    this.pdfDoc
      .setFont(
        this.font,
        'normal',
        this.formatting[
          `${textElement}.fontWeight` as keyof Omit<PageStyle, 'pageMargins'>
        ] || FontWeights.REGULAR,
      )
      .setFontSize(
        this.formatting[
          `${textElement}.fontSize` as keyof Omit<PageStyle, 'pageMargins'>
        ] || 11,
      )
      .setLineHeightFactor(
        this.formatting[
          `${textElement}.lineHeight` as keyof Omit<PageStyle, 'pageMargins'>
        ] || 1.15,
      );
  }

  /**
   * Calcs height of lines in inches with currently active text style.
   * @param numberLines Number of text lines
   * @returns The total height in inches
   */
  private _calcTotalLineHeight(numberLines: number): number {
    return (this.pdfDoc.getLineHeight() / PDFCreator.JSPDF_PPI) * numberLines;
  }

  // TODO: works only if two elements are beside each other
  /**
   * Calcs width of element excluding margin.
   * @param portion of printable width (excluding page  margin and half element margin)
   * @returns The width of the element in inches.
   */
  private _calcElementWidth(portion: number): number {
    return this.maxLineWidth * portion - this.formatting.elementMargin / 2;
  }

  /**
   * Calcutlates placement of title. Position depends on page margins. Height does not depend on actual lines but on maxLineCount.
   * @param title The title.
   * @param width The width of the title text element.
   * @param maxLineCount max number of title lines.
   */
  private _calcTitlePlacement(
    title: string[],
    width: number,
    maxLineCount: number,
  ): ElementPlacement {
    return {
      coords: {
        x: this.formatting.pageMargins[3],
        // margin + half of the space that is added to font size by lineheight
        y:
          this.formatting.pageMargins[0] +
          this._calcTotalLineHeight(maxLineCount) / 2 -
          this._calcTotalLineHeight(title.length) / 2,
      },
      size: {
        width,
        // lower border depends only on maxLineCount, not on title line number
        height:
          this._calcTotalLineHeight(maxLineCount) / 2 +
          this._calcTotalLineHeight(title.length) / 2,
      },
    };
  }

  /**
   * Calcutlates placement of the logo. Position depends on page margins. Height does depend on font size of title.
   * @param logo The logo.
   */
  private _calcLogoPlacement(logo: HTMLImageElement): ElementPlacement {
    const aspectRatio = logo.width / logo.height;
    const printHeight = this._calcTotalLineHeight(
      this.formatting['logo.scale'],
    );
    return {
      coords: {
        x:
          this.pdfSize.width -
          this.formatting.pageMargins[3] -
          printHeight * aspectRatio,
        y:
          this.formatting.pageMargins[0] +
          this._calcTotalLineHeight(
            this.formatting[`title.maxLineCount.${this.orientation}`],
          ) /
            2 -
          printHeight / 2,
      },
      size: {
        width: printHeight * aspectRatio,
        height: printHeight,
      },
    };
  }

  /** Calcutlates placement of the contact information. Position depends on page margins and height on number of possible contact keys. */
  private _calcContactPlacement(): ElementPlacement {
    return {
      coords: {
        x: this.formatting.pageMargins[3],
        // +1 for title of contact.
        y:
          this.pdfSize.height -
          this.formatting.pageMargins[2] -
          this._calcTotalLineHeight(Object.keys(contactKeysPattern).length + 1),
      },
      size: {
        // +1 for title of contact.
        width: this._calcElementWidth(
          this.formatting[`info.widthPortion.${this.orientation}`],
        ),
        height: this._calcTotalLineHeight(
          Object.keys(contactKeysPattern).length + 1,
        ),
      },
    };
  }

  /**
   * Calcutlates placement of the map information. Position depends on page margins and contact info availability.
   * Height on number of possible contact keys.
   */
  private _calcMapInfoPlacement(): ElementPlacement {
    const xMargin =
      this.orientation === OrientationOptions.PORTRAIT
        ? this.formatting.elementMargin
        : this.formatting.elementMargin / 2;
    return {
      coords: {
        x: this.contact
          ? this.contactPlacement!.coords.x +
            this.contactPlacement!.size.width +
            xMargin
          : this.formatting.pageMargins[3],
        // +1 for title of contact.
        y:
          this.pdfSize.height -
          this.formatting.pageMargins[2] -
          this._calcTotalLineHeight(Object.keys(contactKeysPattern).length + 1),
      },
      size: {
        // +1 for title of map info.
        width: this._calcElementWidth(
          this.formatting[`info.widthPortion.${this.orientation}`],
        ),
        height: this._calcTotalLineHeight(
          Object.keys(contactKeysPattern).length + 1,
        ),
      },
    };
  }

  /**
   * Calcutlates placement of description. Position depends on page margins and position and height of title.
   * Height is textheight + bottom margin of description.
   * @param description The description.
   * @param width The width of the description text element.
   * @private
   */
  private _calcDescriptionPlacement(
    description: string[],
    width: number,
  ): ElementPlacement {
    let lowerBorder;
    let height;
    let x;
    if (this.orientation === OrientationOptions.PORTRAIT) {
      lowerBorder =
        this.contactPlacement?.coords.y ??
        this.mapInfoPlacement?.coords.y ??
        this.pdfSize.height - this.formatting.pageMargins[2];
      height =
        this._calcTotalLineHeight(description.length) +
        this.formatting.elementMargin;
      x = this.formatting.pageMargins[3];
    } else {
      lowerBorder = this.pdfSize.height - this.formatting.pageMargins[2];
      height =
        this.contactPlacement?.size.height ??
        this.mapInfoPlacement?.size.height ??
        this._calcTotalLineHeight(description.length);
      x = this.pdfSize.width - this.formatting.pageMargins[1] - width;
    }
    return {
      coords: { x, y: lowerBorder - height },
      size: { width, height },
    };
  }

  /**
   * Calculates the placement of the screenshot with max width and max height.
   * Position depends on page margins and position and height of title + description.
   * Max height and max width is the available space on the page.
   * @param aspectRatio The aspect ratio of the image to be placed on the pdf.
   * @returns Placement of screenshot.
   */
  private _calcImagePlacement(aspectRatio: number): ElementPlacement {
    let upperBorder;
    if (this.title) {
      upperBorder =
        this.titlePlacement!.coords.y +
        this.titlePlacement!.size.height +
        this.formatting.elementMargin;
    } else if (this.logo) {
      upperBorder =
        this.logoPlacement!.coords.y +
        this.logoPlacement!.size.height +
        this.formatting.elementMargin;
    } else {
      upperBorder = this.formatting.pageMargins[0];
    }
    let lowerBorder;
    if (this.description) {
      lowerBorder =
        this.descriptionPlacement!.coords.y - this.formatting.elementMargin;
    } else if (this.contact) {
      lowerBorder =
        this.contactPlacement!.coords.y - this.formatting.elementMargin;
    } else if (this.mapInfo) {
      lowerBorder =
        this.mapInfoPlacement!.coords.y - this.formatting.elementMargin;
    } else {
      lowerBorder = this.formatting.pageMargins[2];
    }
    // calc potential values by checking available space.
    let height = lowerBorder - upperBorder;
    let width = this.maxLineWidth;
    const potentialAspectRatio = width / height;
    let x = this.formatting.pageMargins[3];

    // compare with actual canvas aspect ratio to see which is the limiting factor.
    // Correct values accordingly.
    if (aspectRatio < potentialAspectRatio) {
      width = height * aspectRatio;
      x = this.pdfSize.width / 2 - width / 2;
    } else {
      height = width / aspectRatio;
    }

    return {
      coords: { x, y: upperBorder },
      size: { width, height },
    };
  }

  private _calcCopyrightPlacement(copyright: string): ElementPlacement {
    this._setTextStyle('info');
    this.pdfDoc.setFontSize(6);
    const lines: string[] = this.pdfDoc.splitTextToSize(
      copyright,
      this.imgPlacement!.size.width,
    );
    const height = this._calcTotalLineHeight(lines.length);
    let width = 0;

    lines.forEach((line) => {
      const lineWidth = this.pdfDoc.getTextWidth(line);
      if (lineWidth > width) {
        width = lineWidth;
      }
    });

    const x =
      this.imgPlacement!.coords.x + this.imgPlacement!.size.width - width;
    const y =
      this.imgPlacement!.coords.y + this.imgPlacement!.size.height - height;
    return {
      coords: { x, y },
      size: { width, height },
    };
  }

  /**
   * Adds a page to the PDF document, on which is added the title of the layer
   * whose legend entries are being added. Sets the text style to `info`.
   * @returns The title height.
   */
  private _addLegendPage(): number {
    this.pdfDoc.addPage(
      this.legend!.config.format,
      this.legend!.config.orientation,
    );
    this._setTextStyle('title');
    this.pdfDoc.setFontSize(12);
    const maxWidth =
      this.pdfSize.width -
      this.formatting.pageMargins[1] -
      this.formatting.pageMargins[3];
    this.pdfDoc.text(
      this.currentLayerTitle!,
      this.formatting.pageMargins[1],
      this.formatting.pageMargins[0],
      { baseline: 'top', maxWidth },
    );
    // Add legend items
    const titleHeight = this.pdfDoc.getTextDimensions(
      this.currentLayerTitle!,
    ).h;
    this._setTextStyle('info');
    return titleHeight;
  }

  /**
   * Creates a PDF file using the data from the init function as well as the input canvas. init() needs to be executed first.
   * @param canvas Canvas with screenshot of map.
   * @returns The created PDF as blob.
   */
  async create(
    canvas: HTMLCanvasElement,
    translate: (s: string) => string,
  ): Promise<Blob> {
    if (!this.initialized) {
      throw new Error(
        'pdfCreator instance needs first to be initialized by calling init method.',
      );
    }

    if (this.title) {
      this._setTextStyle('title');
      this.pdfDoc.text(
        this.title,
        this.titlePlacement!.coords.x,
        this.titlePlacement!.coords.y,
        { baseline: 'top' },
      );
    }

    this.pdfDoc.addImage(
      canvas,
      'JPEG',
      this.imgPlacement!.coords.x,
      this.imgPlacement!.coords.y,
      this.imgPlacement!.size.width,
      this.imgPlacement!.size.height,
    );

    if (this.copyright) {
      this._setTextStyle('info');
      this.pdfDoc.setFillColor(0, 0, 0, 0.1);
      this.pdfDoc.rect(
        this.copyrightPlacement!.coords.x,
        this.copyrightPlacement!.coords.y,
        this.copyrightPlacement!.size.width,
        this.copyrightPlacement!.size.height,
        'F',
      );
      this.pdfDoc.setFontSize(6);
      this.pdfDoc.text(
        this.pdfDoc.splitTextToSize(
          this.copyright,
          this.copyrightPlacement!.size.width,
        ),
        this.copyrightPlacement!.coords.x,
        this.copyrightPlacement!.coords.y,
        { baseline: 'top' },
      );
    }

    if (this.logo) {
      this.pdfDoc.addImage(
        this.logo,
        this.logoPlacement!.coords.x,
        this.logoPlacement!.coords.y,
        this.logoPlacement!.size.width,
        this.logoPlacement!.size.height,
      );
    }

    if (this.contact) {
      this._setTextStyle('info');
      // -1 line height in y because of contact header
      this.pdfDoc.text(
        this.contact.text,
        this.contactPlacement!.coords.x,
        this.contactPlacement!.coords.y + this._calcTotalLineHeight(1),
        { baseline: 'hanging' },
      );
      this.pdfDoc.setFont(this.font, 'normal', FontWeights.BOLD);
      this.pdfDoc.text(
        this.contact.header,
        this.contactPlacement!.coords.x,
        this.contactPlacement!.coords.y,
        { baseline: 'hanging' },
      );
    }

    if (this.mapInfo) {
      this._setTextStyle('info');
      // -1 line height in y because of map info header
      this.pdfDoc.text(
        this.mapInfo.text,
        this.mapInfoPlacement!.coords.x,
        this.mapInfoPlacement!.coords.y + this._calcTotalLineHeight(1),
        { baseline: 'hanging' },
      );
      this.pdfDoc.setFont(this.font, 'normal', FontWeights.BOLD);
      this.pdfDoc.text(
        this.mapInfo.header,
        this.mapInfoPlacement!.coords.x,
        this.mapInfoPlacement!.coords.y,
        { baseline: 'hanging' },
      );
    }

    if (this.description) {
      this._setTextStyle('description');
      if (this.orientation === OrientationOptions.PORTRAIT) {
        this.pdfDoc.text(
          this.description,
          this.descriptionPlacement!.coords.x,
          this.imgPlacement!.coords.y +
            this.imgPlacement!.size.height +
            this.formatting.elementMargin,
          { baseline: 'hanging' },
        );
      } else {
        this.pdfDoc.text(
          this.description,
          this.descriptionPlacement!.coords.x,
          this.descriptionPlacement!.coords.y,
          { baseline: 'hanging' },
        );
      }
    }

    if (this.legend) {
      const { format, orientation } = this.legend.config;
      const isLandscape = orientation === LegendOrientationOptions.LANDSCAPE;
      const size: Size = isLandscape
        ? { width: pageSizes[format][1], height: pageSizes[format][0] }
        : { width: pageSizes[format][0], height: pageSizes[format][1] };

      const items = this.legend.items.filter((i) => !!i.legends.length);
      for await (const legendEntry of items) {
        this.currentLayerTitle = legendEntry.title;
        const titleHeight = this._addLegendPage();
        const legendConfig = {
          size,
          useColumns: isLandscape && legendEntry.legends.length > 1,
          origin: {
            x: this.formatting.pageMargins[3],
            y:
              this.formatting.pageMargins[0] +
              titleHeight +
              this.formatting.elementMargin,
          },
        };
        await addLayerLegend(
          this.pdfDoc,
          this.formatting,
          legendEntry.legends,
          () => this._addLegendPage(),
          translate,
          legendConfig,
        );
      }
    }

    return Promise.resolve(this.pdfDoc.output('blob'));
  }

  /**
   * Adds font with regular and bold font weight to jsPdf document instance.
   * @param fonts
   * @returns name of font.
   */
  private async _addFonts(fonts: {
    name: string;
    bold: string;
    regular: string;
  }): Promise<string> {
    /**
     * Adds a custom font to the jsPDF instance.
     * @param name Name of font
     * @param fontPath Path to ttf file of font.
     * @param fontWeight Weight of font.
     * @param pdfDoc The pdfDoc instance.
     */
    async function addFont(
      name: string,
      fontPath: string,
      fontWeight: number,
      pdfDoc: jsPDF,
    ): Promise<void> {
      const font = await fetch(fontPath).then((response) => response.blob());
      const base64url: string = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (): void => resolve(reader.result as string);
        reader.readAsDataURL(font);
      });

      // removes text at beginning
      const base64String = base64url.split(',', 2)[1];

      pdfDoc.addFileToVFS(`${name}-${fontWeight}.ttf`, base64String);
      pdfDoc.addFont(`${name}-${fontWeight}.ttf`, name, 'normal', fontWeight);
    }

    await addFont(fonts.name, fonts.regular, FontWeights.REGULAR, this.pdfDoc);
    await addFont(fonts.name, fonts.bold, FontWeights.BOLD, this.pdfDoc);

    // Only one custom font is allowed so the name of the first is returned and therefore used.
    return fonts.name;
  }
}
