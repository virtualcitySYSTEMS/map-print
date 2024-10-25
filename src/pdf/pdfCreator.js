import { jsPDF } from 'jspdf';
import pageSizes from './standardPageSizes.js';
import { pageStyles, FontWeights } from './styles.js';
import {
  contactKeysPattern,
  OrientationOptions,
} from '../common/configManager.js';

/**
 * @typedef {Object} Coords 2D coordinates. Origin is upper left corner.
 * @property {number} x - x coordinate
 * @property {number} y - y coordinate
 */

/**
 * @typedef {Object} Size Dimensions of Element
 * @property {number} width - width
 * @property {number} height - height
 */

/**
 * @typedef {Object} ElementPlacement
 * @property {Coords} coords - Coordinates of upper left corner in inches. Origin is upper left corner of pdf document.
 * @property {Size} size - width and height
 */

/**
 * @typedef {Object} TextWithHeader
 * @property {string} header
 * @property {Array<string>} text
 */

/**
 * @typedef {Object} PDFCreatorOptions
 * @property {"portrait" | "landscape"} orientation The orientation of the PDF.
 * @property {string} format The format of the PDF.
 * @property {string | undefined} title The title at the beginning of the PDF.
 * @property {HTMLImageElement | undefined} logo The map logo.
 * @property {number} imgRatio The aspect ratio of the input image.
 * @property {string | undefined} description The description below the image.
 * @property {TextWithHeader | undefined} contact The contact information in the lower left corner.
 * @property {TextWithHeader | undefined} mapInfo Information about the map content.
 * @property {string | undefined} copyright Information about the copyright.
 * @property {{name: string, bold: string, regular: string} | undefined} fonts Paths to bold and regular weight for named font.
 */

export default class PDFCreator {
  /** PPI of JSPDF for calculaing e.g. fontsize */
  static JSPDF_PPI = 72;

  /**
   * Calculates the positioning of the elements to be placed on the PDF.
   * @param {PDFCreatorOptions} pdfCreatorOptions The params for PDFCreator setup wrapped in an object.
   */
  async setup(pdfCreatorOptions) {
    if (pageStyles[pdfCreatorOptions.format]) {
      this.formatting = Object.assign(
        pageStyles.default,
        pageStyles[pdfCreatorOptions.format],
      );
    } else {
      this.formatting = pageStyles.default;
    }

    /**
     * Size of PDF depending on input format.
     * @type {Size}
     */
    this.pdfSize =
      pdfCreatorOptions.orientation === OrientationOptions.PORTRAIT
        ? {
            width: pageSizes[pdfCreatorOptions.format][0],
            height: pageSizes[pdfCreatorOptions.format][1],
          }
        : {
            width: pageSizes[pdfCreatorOptions.format][1],
            height: pageSizes[pdfCreatorOptions.format][0],
          };
    /**
     * The line width where content can be added (excluding margins).
     * @type {number}
     */
    this.maxLineWidth =
      this.pdfSize.width -
      this.formatting.pageMargins[1] -
      this.formatting.pageMargins[3];

    /**
     * the jsPDF instance for creating the PDF and adding content.
     * @type {jsPDF}
     */
    // eslint-disable-next-line new-cap
    this.pdfDoc = new jsPDF(
      pdfCreatorOptions.orientation,
      'in',
      pdfCreatorOptions.format,
    );

    if (pdfCreatorOptions.fonts) {
      this.font = await this._addFonts(pdfCreatorOptions.fonts);
    } else {
      this.font = 'helvetica';
    }

    /**
     * The orientation of the pdf.
     * @type {"landscape" | "portrait"}
     */
    this.orientation = pdfCreatorOptions.orientation;

    if (pdfCreatorOptions.title) {
      const width = this._calcElementWidth(
        this.formatting[`title.widthPortion.${pdfCreatorOptions.orientation}`],
      );
      const maxLineCount =
        this.formatting[`title.maxLineCount.${this.orientation}`];

      this._setTextStyle('title');
      const titleArray = this.pdfDoc.splitTextToSize(
        pdfCreatorOptions.title,
        width,
      );
      /**
       * The title string of the pdf splitted according to line length.
       * Each element of array is new line.
       * If title is longer than maxLineCount defined in styles.js it is shortend.
       * 'undefined' if no input title available.
       * @type {Array<string> | undefined}
       */
      this.title = titleArray.slice(0, maxLineCount);
      /**
       * Position and dimensions of the title.
       * @type {ElementPlacement}
       */
      this.titlePlacement = this._calcTitlePlacement(width, maxLineCount);
    }

    if (pdfCreatorOptions.logo) {
      this._setTextStyle('title');
      /**
       * The navbar logo from the map which is printed in the upper right corner.
       * @type {HTMLImageElement | undefined}
       */
      this.logo = pdfCreatorOptions.logo;
      /**
       * Position and dimensions of the logo.
       * @type {ElementPlacement}
       */
      this.logoPlacement = this._calcLogoPlacement();
    }

    if (pdfCreatorOptions.contact) {
      this._setTextStyle('info');
      /**
       * Contact information already splitted by configManager.
       * @type {TextWithHeader | undefined}
       */
      this.contact = pdfCreatorOptions.contact;
      /**
       * Position and dimensions of the contact information.
       * @type {ElementPlacement}
       */
      this.contactPlacement = this._calcContactPlacement();
    }

    if (pdfCreatorOptions.mapInfo) {
      this._setTextStyle('info');
      /**
       * Map info provided by mapInfoCollector.
       * @type {TextWithHeader | undefined}
       */
      this.mapInfo = pdfCreatorOptions.mapInfo;
      /**
       * Position and dimensions of the map information.
       * @type {ElementPlacement}
       */
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
      const descriptionArray = this.pdfDoc.splitTextToSize(
        pdfCreatorOptions.description,
        width,
      );
      /**
       * The description string of the pdf splitted according to line length.
       * Each element of array is new line.
       * If description is longer than maxLineCount defined in styles.js it is shortend.
       * `undefined` if no input description available.
       * @type {Array<string> | undefined}
       */
      this.description = descriptionArray.slice(0, maxLineCount);

      /**
       * Position and dimensions of the description.
       * @type {ElementPlacement}
       */
      this.descriptionPlacement = this._calcDescriptionPlacement(width);
    }

    /**
     * Position and dimensions of the image.
     * @type {ElementPlacement}
     */
    this.imgPlacement = this._calcImagePlacement(pdfCreatorOptions.imgRatio);

    if (pdfCreatorOptions.copyright) {
      this._setTextStyle('info');
      /**
       * Unique copyright from all active layers.
       * @type {string}
       */
      this.copyright = pdfCreatorOptions.copyright;
      /**
       * Position and dimensions of the copyright.
       * @type {ElementPlacement}
       */
      this.copyrightPlacement = this._calcCopyrightPlacement(
        pdfCreatorOptions.copyright,
      );
    }

    this.initialized = true;
  }

  /**
   * Sets text style globally on {@link jsPDF} instance of {@link PDFCreator}.
   * @param {string} textElement Name of a text element with font size and style declared.
   * @example 'description'
   * @private
   */
  _setTextStyle(textElement) {
    this.pdfDoc
      .setFont(
        this.font,
        'normal',
        this.formatting[`${textElement}.fontWeight`] || FontWeights.REGULAR,
      )
      .setFontSize(this.formatting[`${textElement}.fontSize`] || 11)
      .setLineHeightFactor(
        this.formatting[`${textElement}.lineHeight`] || 1.15,
      );
  }

  /**
   * Calcs height of lines in inches with currently active text style.
   * @param {number} numberLines Number of text lines
   * @returns {number} The total height in inches
   * @private
   */
  _calcTotalLineHeight(numberLines) {
    return (this.pdfDoc.getLineHeight() / PDFCreator.JSPDF_PPI) * numberLines;
  }

  // TODO: works only if two elements are beside each other
  /**
   * Calcs width of element excluding margin.
   * @param {number} portion of printable width (excluding page  margin and half element margin)
   * @returns {number} The width of the element in inches.
   * @private
   */
  _calcElementWidth(portion) {
    return this.maxLineWidth * portion - this.formatting.elementMargin / 2;
  }

  /**
   * Calcutlates placement of title. Position depends on page margins. Height does not depend on actual lines but on maxLineCount.
   * @param {number} width The width of the title text element.
   * @param {number} maxLineCount max number of title lines.
   * @returns {ElementPlacement}
   * @private
   */
  _calcTitlePlacement(width, maxLineCount) {
    return {
      coords: {
        x: this.formatting.pageMargins[3],
        // margin + half of the space that is added to font size by lineheight
        y:
          this.formatting.pageMargins[0] +
          this._calcTotalLineHeight(maxLineCount) / 2 -
          this._calcTotalLineHeight(this.title.length) / 2,
      },
      size: {
        width,
        // lower border depends only on maxLineCount, not on title line number
        height:
          this._calcTotalLineHeight(maxLineCount) / 2 +
          this._calcTotalLineHeight(this.title.length) / 2,
      },
    };
  }

  /**
   * Calcutlates placement of the logo. Position depends on page margins. Height does depend on font size of title.
   * @returns {ElementPlacement}
   * @private
   */
  _calcLogoPlacement() {
    const aspectRatio = this.logo.width / this.logo.height;
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

  /**
   * Calcutlates placement of the contact information. Position depends on page margins and height on number of possible contact keys.
   * @returns {ElementPlacement}
   * @private
   */
  _calcContactPlacement() {
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
   * @returns {ElementPlacement}
   * @private
   */
  _calcMapInfoPlacement() {
    const xMargin =
      this.orientation === OrientationOptions.PORTRAIT
        ? this.formatting.elementMargin
        : this.formatting.elementMargin / 2;
    return {
      coords: {
        x: this.contact
          ? this.contactPlacement.coords.x +
            this.contactPlacement.size.width +
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
   * @param {number} width The width of the description text element.
   * @returns {ElementPlacement}
   * @private
   */
  _calcDescriptionPlacement(width) {
    let lowerBorder;
    let height;
    let x;
    if (this.orientation === OrientationOptions.PORTRAIT) {
      lowerBorder =
        this.contactPlacement?.coords.y ??
        this.mapInfoPlacement?.coords.y ??
        this.pdfSize.height - this.formatting.pageMargins[2];
      height =
        this._calcTotalLineHeight(this.description.length) +
        this.formatting.elementMargin;
      x = this.formatting.pageMargins[3];
    } else if (this.orientation === OrientationOptions.LANDSCAPE) {
      lowerBorder = this.pdfSize.height - this.formatting.pageMargins[2];
      height =
        this.contactPlacement?.size.height ??
        this.mapInfoPlacement?.size.height ??
        this._calcTotalLineHeight(this.description.length);
      x = this.pdfSize.width - this.formatting.pageMargins[1] - width;
    }
    return {
      coords: {
        x,
        y: lowerBorder - height,
      },
      size: {
        width,
        height,
      },
    };
  }

  /**
   * Calculates the placement of the screenshot with max width and max height.
   * Position depends on page margins and position and height of title + description.
   * Max height and max width is the available space on the page.
   * @param {number} aspectRatio The aspect ratio of the image to be placed on the pdf.
   * @returns {ElementPlacement} Placement of screenshot.
   * @private
   */
  _calcImagePlacement(aspectRatio) {
    let upperBorder;
    if (this.title) {
      upperBorder =
        this.titlePlacement.coords.y +
        this.titlePlacement.size.height +
        this.formatting.elementMargin;
    } else if (this.logo) {
      upperBorder =
        this.logoPlacement.coords.y +
        this.logoPlacement.size.height +
        this.formatting.elementMargin;
    } else {
      upperBorder = this.formatting.pageMargins[0];
    }
    let lowerBorder;
    if (this.description) {
      lowerBorder =
        this.descriptionPlacement.coords.y - this.formatting.elementMargin;
    } else if (this.contact) {
      lowerBorder =
        this.contactPlacement.coords.y - this.formatting.elementMargin;
    } else if (this.mapInfo) {
      lowerBorder =
        this.mapInfoPlacement.coords.y - this.formatting.elementMargin;
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
      coords: {
        x,
        y: upperBorder,
      },
      size: {
        width,
        height,
      },
    };
  }

  _calcCopyrightPlacement(copyright) {
    this._setTextStyle('info');
    this.pdfDoc.setFontSize(6);
    const lines = this.pdfDoc.splitTextToSize(
      copyright,
      this.imgPlacement.size.width,
    );
    const height = this._calcTotalLineHeight(lines.length);
    let width = 0;

    lines.forEach((line) => {
      const lineWidth = this.pdfDoc.getTextWidth(line);
      if (lineWidth > width) {
        width = lineWidth;
      }
    });

    const x = this.imgPlacement.coords.x + this.imgPlacement.size.width - width;
    const y =
      this.imgPlacement.coords.y + this.imgPlacement.size.height - height;
    return {
      coords: {
        x,
        y,
      },
      size: {
        width,
        height,
      },
    };
  }

  /**
   * Creates a PDF file using the data from the init function as well as the input canvas. init() needs to be executed first.
   * @param {HTMLCanvasElement} canvas Canvas with screenshot of map.
   * @returns {Promise<Blob>} The created PDF as blob.
   */
  async create(canvas) {
    if (!this.initialized) {
      throw new Error(
        'pdfCreator instance needs first to be initialized by calling init method.',
      );
    }

    if (this.title) {
      this._setTextStyle('title');
      this.pdfDoc.text(
        this.title,
        this.titlePlacement.coords.x,
        this.titlePlacement.coords.y,
        { baseline: 'top' },
      );
    }

    this.pdfDoc.addImage(
      canvas,
      'JPEG',
      this.imgPlacement.coords.x,
      this.imgPlacement.coords.y,
      this.imgPlacement.size.width,
      this.imgPlacement.size.height,
    );

    if (this.copyright) {
      this._setTextStyle('info');
      this.pdfDoc.setFillColor(0, 0, 0, 0.1);
      this.pdfDoc.rect(
        this.copyrightPlacement.coords.x,
        this.copyrightPlacement.coords.y,
        this.copyrightPlacement.size.width,
        this.copyrightPlacement.size.height,
        'F',
      );
      this.pdfDoc.setFontSize(6);
      this.pdfDoc.text(
        this.pdfDoc.splitTextToSize(
          this.copyright,
          this.copyrightPlacement.size.width,
        ),
        this.copyrightPlacement.coords.x,
        this.copyrightPlacement.coords.y,
        { baseline: 'top' },
      );
    }

    if (this.logo) {
      this.pdfDoc.addImage(
        this.logo,
        this.logoPlacement.coords.x,
        this.logoPlacement.coords.y,
        this.logoPlacement.size.width,
        this.logoPlacement.size.height,
      );
    }

    if (this.contact) {
      this._setTextStyle('info');
      // -1 line height in y because of contact header
      this.pdfDoc.text(
        this.contact.text,
        this.contactPlacement.coords.x,
        this.contactPlacement.coords.y + this._calcTotalLineHeight(1),
        { baseline: 'hanging' },
      );
      this.pdfDoc.setFont(this.font, 'normal', FontWeights.BOLD);
      this.pdfDoc.text(
        this.contact.header,
        this.contactPlacement.coords.x,
        this.contactPlacement.coords.y,
        { baseline: 'hanging' },
      );
    }

    if (this.mapInfo) {
      this._setTextStyle('info');
      // -1 line height in y because of map info header
      this.pdfDoc.text(
        this.mapInfo.text,
        this.mapInfoPlacement.coords.x,
        this.mapInfoPlacement.coords.y + this._calcTotalLineHeight(1),
        { baseline: 'hanging' },
      );
      this.pdfDoc.setFont(this.font, 'normal', FontWeights.BOLD);
      this.pdfDoc.text(
        this.mapInfo.header,
        this.mapInfoPlacement.coords.x,
        this.mapInfoPlacement.coords.y,
        { baseline: 'hanging' },
      );
    }

    if (this.description) {
      this._setTextStyle('description');
      if (this.orientation === OrientationOptions.PORTRAIT) {
        this.pdfDoc.text(
          this.description,
          this.descriptionPlacement.coords.x,
          this.imgPlacement.coords.y +
            this.imgPlacement.size.height +
            this.formatting.elementMargin,
          { baseline: 'hanging' },
        );
      } else {
        this.pdfDoc.text(
          this.description,
          this.descriptionPlacement.coords.x,
          this.descriptionPlacement.coords.y,
          { baseline: 'hanging' },
        );
      }
    }

    return this.pdfDoc.output('blob');
  }

  /**
   * Adds font with regular and bold font weight to jsPdf document instance.
   * @param {{name: string, bold: string, regular: string}} fonts
   * @returns {Promise<string>} name of font.
   * @private
   */
  async _addFonts(fonts) {
    /**
     * Adds a custom font to the jsPDF instance.
     * @param {string} name Name of font
     * @param {string} fontPath Path to ttf file of font.
     * @param {string} fontWeight Weight of font.
     * @param {jsPDF} pdfDoc The pdfDoc instance.
     */
    async function addFont(name, fontPath, fontWeight, pdfDoc) {
      const font = await fetch(fontPath).then((response) => response.blob());
      const base64url = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
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
