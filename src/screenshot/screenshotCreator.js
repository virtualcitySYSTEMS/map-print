import { CesiumMap, ObliqueMap, OpenlayersMap } from '@vcmap/core';
import { getLogger } from '@vcsuite/logger';

/**
 * @type {number}
 */
export const timeout = 5000;

/**
 * Prepares the cesium map for the screenshot
 * @param {import("@vcmap/core").CesiumMap} map cesium map
 * @param {number} scale The factor to scale the map according to the required resolution
 * @returns {Function} The function to reset the applied scale.
 */
function prepareCesiumMap(map, scale) {
  const viewer = map.getCesiumWidget();
  const { resolutionScale } = viewer;
  viewer.resolutionScale = scale;

  return function resetCesiumMap() {
    viewer.resolutionScale = resolutionScale;
  };
}

/**
 * returns a function to reset the OLMap to the original state
 * @param {import("@vcmap/core").OpenlayersMap|import("@vcmap/core").ObliqueMap} map
 * @param {import("ol/size").Size} renderSize
 * @returns {Function}
 */
function prepareOlMap(map, renderSize) {
  const { olMap } = map;
  const olSize = olMap.getSize();
  const extent = olMap.getView().calculateExtent(olSize);
  const originalMinZoom = olMap.getView().getMinZoom();
  const originalMaxZoom = olMap.getView().getMaxZoom();
  olMap.setSize(renderSize);
  olMap.getView().setMinZoom(0);
  olMap.getView().setMaxZoom(28);
  olMap.getView().fit(extent, { size: renderSize });
  olMap.set('vcs_scale', renderSize, true);

  return function resetOlMap() {
    olMap.setSize(olSize);
    olMap.getView().setMinZoom(originalMinZoom);
    olMap.getView().setMaxZoom(originalMaxZoom);
    olMap.getView().fit(extent, { size: olSize });
    olMap.unset('vcs_scale', true);
    olMap.renderSync();
  };
}

/**
 * copies cesium content on the given canvas
 * @param {import("@vcmap/core").CesiumMap} map
 * @returns {Promise<HTMLCanvasElement>}
 */
async function getImageFromCesium(map) {
  const { scene } = map.getCesiumWidget();

  return new Promise((resolve) => {
    const removePreListener = scene.preUpdate.addEventListener(() => {
      const { canvas } = scene;
      const removePostListener = scene.postRender.addEventListener(() => {
        resolve(canvas);
        removePostListener();
      });
      removePreListener();
    });
  });
}

/**
 * copies cesium content on the given canvas
 * @param {import("@vcmap/core").OpenlayersMap|import("@vcmap/core").ObliqueMap} map
 * @param {import('ol/size').Size} canvasSize
 * @returns {Promise<HTMLCanvasElement>}
 */
async function getImageFromOpenlayers(map, canvasSize) {
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize[0];
  canvas.height = canvasSize[1];
  const { olMap } = map;
  const canvasContext = canvas.getContext('2d');
  await new Promise((resolve) => {
    olMap.once('rendercomplete', () => {
      /** @type {Array<HTMLCanvasElement>} */
      const olLayerCanvasList =
        /** @type {Array<HTMLCanvasElement>} */ Array.from(
          olMap.getViewport().querySelectorAll('.ol-layer canvas'),
        );
      olLayerCanvasList.forEach((layerCanvas) => {
        if (layerCanvas.width > 0) {
          const opacity =
            layerCanvas.parentNode?.style?.opacity ||
            layerCanvas.style?.opacity;
          canvasContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
          // fill canvas with white so transparent pixels are not printed as black when exporting as jpeg.
          canvasContext.fillStyle =
            layerCanvas.parentNode?.style?.backgroundColor ||
            'rgba(255,255,255,1)';
          canvasContext.fillRect(0, 0, canvas.width, canvas.height);
          const { transform } = layerCanvas.style;
          const matrix =
            /** @type {[number, number, number, number, number, number] | undefined} */ (
              transform
                .match(/^matrix\(([^(]*)\)$/)?.[1]
                .split(',')
                .map(Number)
            );
          if (matrix) {
            canvasContext.setTransform(...matrix);
          }
          canvasContext.drawImage(layerCanvas, 0, 0);
        }
      });
      resolve();
    });
  });
  return canvas;
}

/**
 * Renders Screenshot of the currently active map with all active Layers in a given pixel width.
 * Height is calculated from current aspect ratio.
 * @param {import("@vcmap/core").VcsApp} app The VcsUiApp instance
 * @param {number} width Width of the rendered image in pixel.
 * @returns {Promise<HTMLCanvasElement>} Canvas of Screenshot.
 */
export async function renderScreenshot(app, width) {
  let screenshotCanvas;

  /**
   * Calculates the width and height of the screenshot.
   * @param {import("ol/size").Size} mapSize Size of the acive map.
   * @param {number} screenshotWidth Width of the screenshot that needs to be created.
   * @returns {import("ol/size").Size} The size to be rendered for the screenshot.
   */
  function calcRenderSize(mapSize, screenshotWidth) {
    const aspectRatio = mapSize[0] / mapSize[1];
    return [screenshotWidth, screenshotWidth / aspectRatio];
  }

  /**
   * Logs a warning if the total pixel count exceeds a threshold of chromium based browsers.
   * @param {import("ol/size").Size} renderSize Width and height of the screenshot to be created.
   * @param {number} threshold The max pixel count.
   */
  function checkChromeMaxPixel(renderSize, threshold) {
    // TODO: show notification in UI for user
    // TODO: reevaluate chromium behaviour regarding max pixel count
    const totalPixelCount = renderSize[0] * renderSize[1];
    if (totalPixelCount > threshold && window.chrome) {
      getLogger('@vcmap/print').warning(
        `The created image might have black bars at some of the edges. This is due to a behavior of chromium based browsers
        that occurs when the total pixel count of the cesium map exceeds a threshold of thirty-three million pixels.
        In order to avoid this either reduce the resolution or switch to Mozilla Firefox browser.`,
      );
    }
  }

  /**
   * Function for resetting map after screenshot processes finished.
   * @type {Function}
   */
  let resetMap;
  const map = app.maps.activeMap;

  if (map instanceof CesiumMap) {
    const mapSize = ['width', 'height'].map(
      (dimension) => map.getCesiumWidget().scene.canvas[dimension],
    );
    // check if render size is above chromium threshold
    checkChromeMaxPixel(calcRenderSize(mapSize, width), 33000000);
    const scale = width / mapSize[0];
    resetMap = prepareCesiumMap(map, scale);
    screenshotCanvas = await getImageFromCesium(map);
  } else if (map instanceof OpenlayersMap || map instanceof ObliqueMap) {
    const biggestCanvas = Array.from(
      map.olMap.getViewport().querySelectorAll('.ol-layer canvas'),
    ).reduce((acc, val) => (acc.width > val.width ? val : acc));
    const mapSize = ['width', 'height'].map(
      (dimension) => biggestCanvas[dimension],
    );
    const renderSize = calcRenderSize(mapSize, width);
    resetMap = prepareOlMap(map, renderSize);
    screenshotCanvas = await getImageFromOpenlayers(map, renderSize);
  } else {
    throw new Error('wrong Map');
  }
  resetMap();
  return screenshotCanvas;
}
