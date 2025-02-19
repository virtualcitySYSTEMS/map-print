# v3.0.0

- Updates @vcmap/core and @vcmap/ui to version 6.1
- add support for Ui mobile view

# v2.1.0

- Convert Print plugin to TypeScript
- Move render Screenshot functionality to @vcmap/core.
- Adds FeatureInfo Window printing option.
- Adds Legend printing option.
- Fixes a bug where a same Copyright entry could be printed multiple times.
- Improves clarity of the ConfigEditor labels

# v2.0.2

- Fixes a bug where the App logo would not be printed in PDF

# v2.0.1

- Adds input validation to config editor and ensures correct types for default values.
- Fixes buggy toJSON function of plugin

# v2.0.0

- Updates @vcmap/core and @vcmap/ui to version 6.x
- Fixes plugin crash when logo can not be loaded due to CORS error.
- Adds `crossOrigin="anonymous"` to image loading logo.
- Adds copyright to screenshot.

# v1.0.11

- Fixes a bug where every layer had white background, which covered layers below

# v1.0.10

- Changes transparent background to be white instead of black

# v1.0.9

- Fixes a bug where screenshots with active geojson layer had transparency issues
- Fixes a bug where some flags in could not be changed in the Plugin Editor

# v1.0.8

- Fix i18n en
- audit fix

# v1.0.7

- Fix deactivate on destroy
- Fix swipe element titles translation
- Add getDefaultOptions and toJSON API
- Add plugin config editor

# v0.1.0

- Document features and fixes
