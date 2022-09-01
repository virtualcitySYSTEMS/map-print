# @vcmap/print 

## general

The print plugin enables the user to create images and PDFs from the current view of the map. The main difference to the OS or browser integrated screenshot tool is that the user has impact on the quality of the created image and only specific elements of the map are printed on the image. Futhermore a PDF file with the image and additional information can be created.

In the image/JPEG mode, the user can select a resolution. Each time the window size is changed the resolution adapts accordingly. When pressing the "CREATE"-Button a screenshot of the map is created and downloaded.

In the PDF mode the user can select the page format, the pixels per inch (ppi) and, if configured that way, can add an title and a description. Furthermore it is possible to configure the PDF mode in a way that contact credentials and map information (like coordinates of the current view) are added below the image, each time a PDF is created.

> **Note**: Chromium based browsers can not properly create a screenshot of cesium maps, if the target resolution exceeds a total pixel count of thirty-three million. To avoid this either reduce the resolution or use Mozilla Firefox browser, which can handle larger pixel counts.

## configuration

To add and configure the plugin add an entry with name @vcmap/print to the map's config plugins section.. Below the possible configuration options and their defaults are listed.

### image/JPEG

| key | type | default | description |
| --- | --- | --- | --- |
| resolutionList | Array\<number\> | `[500,720,1280,1920,3840]` | List of possible resolutions. Each resolution consists of only one value. This is always the longes side of the image. Thus, if the width of the map is bigger than the height, the width is the selected value of the resolution list and the height is calculated from the aspect ratio. |
| resolutionDefault | number | `1280` | The default resolution. Needs to be a value of the resolutionList. |


### PDF

| key | type | default | description |
| --- | --- | --- | --- |
| formatList | Array\<string\> | `["A5","A4","A3","A2"]` | The possible standard page sizes. Supported are "A5","A4","A3","A2". |
| formatDefault | string | `"A4"` | The default page size. Needs to be a value of the formatList. |
| ppiList | Array\<number\> | `[75,150,300,450,600]` | List of possible values for pixels per inch (ppi) of the PDF. This value has impact on the resolution of the screenshot that is printed on the pdf. |
| ppiDefault | number | `300` | The default ppi. Needs to be a value of the ppiList. |
| orientationOptions | "portrait" | "landscape" | "both" | "both" | The possible orientation options. "both" means the user can choose either landscape or portrait. If portrait or landscape is used, this user can not choose and the key orientationDefault is ignored. |
| orientationDefault | "portrait" | "landscape" | "portrait" | The default orientation. Only necessary if orientationOptions is "both", otherwise ignored. |
| allowTitle | boolean | `true` | Whether the user can add a title. |
| allowDescription | boolean | `true` | Whether the user can add a description. |
| printLogo | boolean | `true` | Whether the map logo is printed on the PDF. |
| printMapInfo | boolean | `true` | Whether information about the map is printed on the PDF. Map Info is so far the coordinates of the center of the current view. |

> **Note**: The page format specific styling of the PDF can not be modified by the map config file or by the user. If changes are necessary these have to be applied in [source code](#format-specific-styling) (./src/pdf/styles.js).

## development notes

### Unlock new pdf page formats

For unlocking new page formats the following steps are required:
1. Extend the allowed format types in the jsdoc at the constructor of PDFCreator and the printConfig typedef in configManager.js.
2. Remove comment characters in standardPageSizes.js if necessary
3. (optional) add [format specific styling](#format-specific-styling) to ‘styling.js’.
4. Add the new format to README documentation.

### Format specific styling

In order to change the styling of a specific page size/format, a new key has to be added to the ‘pageStyle’ object in `./src/pdf/styles.js`. The key must be the name of the format (e.g. `A6: {}`). Only the relevant keys need to be changed. These will override the keys of the default styling for this specific format.
