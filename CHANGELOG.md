# v4.0.2

- Included Swipe Tool overlay (divider line and labels) in exported PDF and JPG when active
- Fixed copyright symbol on PDF

# v4.0.1

- Added new configuration options extending the Map Information section of the PDF:
  - `printObliqueName`, printing the name of the current oblique image;
  - `printCoordinates`, printing the coordinates of the center of the map or of the camera in Panorama;
  - `coordinatesProj`, allowing to print the coordinates in another CRS than the default WGS84
  - `printLinkToMap`, allowing to print a link to the map
- Updated jsPDF dependency to version 4.x

# v4.0.0

- Updated @vcmap/core and @vcmap/ui to version 6.2
- Added support for Panorama Map

# v3.0.1

- Updated jsPDF Dependency to version 3.x

# v3.0.0

- Updated @vcmap/core and @vcmap/ui to version 6.1
- Added support for Ui mobile view

# v2.1.0

- Converted Print plugin to TypeScript
- Moved render Screenshot functionality to @vcmap/core
- Added FeatureInfo Window printing option
- Added Legend printing option
- Fixed a bug where a same Copyright entry could be printed multiple times
- Improved clarity of the ConfigEditor labels

# v2.0.2

- Fixed a bug where the App logo would not be printed in PDF

# v2.0.1

- Added input validation to config editor and ensures correct types for default values.
- Fixed buggy toJSON function of plugin

# v2.0.0

- Updated @vcmap/core and @vcmap/ui to version 6.x
- Fixed plugin crash when logo can not be loaded due to CORS error.
- Added `crossOrigin="anonymous"` to image loading logo.
- Added copyright to screenshot.

# v1.0.11

- Fixed a bug where every layer had white background, which covered layers below

# v1.0.10

- Changed transparent background to be white instead of black

# v1.0.9

- Fixed a bug where screenshots with active geojson layer had transparency issues
- Fixed a bug where some flags in could not be changed in the Plugin Editor

# v1.0.8

- Fixed i18n en
- audit fix

# v1.0.7

- Fixed deactivate on destroy
- Fixed swipe element titles translation
- Added getDefaultOptions and toJSON API
- Added plugin config editor

# v1.0.0

Export plugin
