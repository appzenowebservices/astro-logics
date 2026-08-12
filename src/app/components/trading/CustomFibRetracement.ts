import {
  Drawing,
  type DrawingStyle,
  type DrawingOptions,
  type IDrawing,
  type Point,
  type Viewport,
  type Geometry,
  type IPrimitivePaneView,
  type Anchor,
  getToolRegistry,
} from "lightweight-charts-drawing";
import type { IPrimitivePaneRenderer } from "lightweight-charts";

const CUSTOM_FIB_LEVELS = [0, 0.214, 0.295, 0.705, 0.786, 1];
const ZONE_DOWN_COLOR = "rgba(255, 0, 0, 0.15)";
const ZONE_UP_COLOR = "rgba(0, 255, 0, 0.15)";
const ZONE_LOWER_COLOR = "rgba(0, 255, 0, 0.15)";
const ZONE_UPPER_COLOR = "rgba(255, 0, 0, 0.15)";

interface CustomFibOptions extends DrawingOptions {
  levels?: number[];
  showPrices?: boolean;
  showPercentages?: boolean;
  extendLines?: boolean;
}

class CustomFibPaneRenderer implements IPrimitivePaneRenderer {
  private drawing: CustomFibRetracement;

  constructor(drawing: CustomFibRetracement) {
    this.drawing = drawing;
  }

  draw(target: {
    useBitmapCoordinateSpace: (
      callback: (info: {
        context: CanvasRenderingContext2D;
        horizontalPixelRatio: number;
      }) => void,
    ) => void;
  }) {
    target.useBitmapCoordinateSpace(({ context, horizontalPixelRatio }) => {
      this.drawImpl(context, horizontalPixelRatio);
    });
  }

  private drawImpl(ctx: CanvasRenderingContext2D, pixelRatio: number) {
    const viewport = this.drawing.getViewport();
    if (!viewport || !this.drawing.isValid()) return;

    const anchors = this.drawing.anchors;
    const startPx = this.drawing.anchorToPixel(anchors[0], viewport);
    const endPx = this.drawing.anchorToPixel(anchors[1], viewport);
    if (!startPx || !endPx) return;

    const levels = this.drawing.fibOptions.levels ?? CUSTOM_FIB_LEVELS;
    const startPrice = anchors[0].price;
    const endPrice = anchors[1].price;
    const priceDiff = endPrice - startPrice;
    const isBullish = priceDiff > 0;

    const leftX = Math.min(startPx.x, endPx.x);
    const extendX = leftX + 10000;

    for (let i = 0; i < levels.length - 1; i++) {
      const level1 = levels[i];
      const level2 = levels[i + 1];

      const isUpperZone = level1 >= 0.214 && level1 <= 0.295;
      const isLowerZone = level1 >= 0.705 && level1 <= 0.786;
      
      if (isUpperZone || isLowerZone) {
        const zoneColor = isBullish
          ? (isLowerZone ? ZONE_LOWER_COLOR : ZONE_UPPER_COLOR)
          : (isUpperZone ? ZONE_UPPER_COLOR : ZONE_LOWER_COLOR);
        const price1 = startPrice + priceDiff * level1;
        const price2 = startPrice + priceDiff * level2;
        const y1 = viewport.priceScale.priceToCoordinate(price1);
        const y2 = viewport.priceScale.priceToCoordinate(price2);

        if (y1 !== null && y2 !== null) {
          ctx.fillStyle = zoneColor;
          ctx.globalAlpha = 0.15;
          ctx.fillRect(
            leftX * pixelRatio,
            Math.min(y1, y2) * pixelRatio,
            (extendX - leftX) * pixelRatio,
            Math.abs(y2 - y1) * pixelRatio,
          );
          ctx.globalAlpha = 1;
        }
      }
    }

    for (const level of levels) {
      const price = startPrice + priceDiff * level;
      const y = viewport.priceScale.priceToCoordinate(price);
      if (y === null) continue;

      const isUpperLevel = level >= 0.214 && level <= 0.295;
      const isLowerLevel = level >= 0.705 && level <= 0.786;
      const lineColor = isBullish
        ? (isLowerLevel ? "#10b981" : isUpperLevel ? "#ef4444" : "#ffffff")
        : (isUpperLevel ? "#ef4444" : isLowerLevel ? "#10b981" : "#ffffff");
      
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = this.drawing.style.lineWidth * pixelRatio;
      ctx.beginPath();
      ctx.moveTo(leftX * pixelRatio, y * pixelRatio);
      ctx.lineTo(extendX * pixelRatio, y * pixelRatio);
      ctx.stroke();
    }
  }
}

class CustomFibPaneView implements IPrimitivePaneView {
  private drawing: CustomFibRetracement;

  constructor(drawing: CustomFibRetracement) {
    this.drawing = drawing;
  }

  zOrder(): "bottom" | "normal" | "top" {
    return "normal";
  }

  renderer(): IPrimitivePaneRenderer {
    return new CustomFibPaneRenderer(this.drawing);
  }
}

class CustomFibRetracement extends Drawing {
  readonly type = "custom-fib-retracement";
  protected static readonly REQUIRED_ANCHORS = 2;
  protected static readonly HIT_THRESHOLD = 5;
  private readonly _fibOptions: CustomFibOptions;

  constructor(
    id: string,
    anchors: Anchor[] = [],
    style: Partial<DrawingStyle> = {},
    options: Partial<CustomFibOptions> = {},
  ) {
    super(id, anchors, style, {
      extendLeft: false,
      extendRight: false,
      ...options,
    });
    this._fibOptions = {
      levels: CUSTOM_FIB_LEVELS,
      showPrices: true,
      showPercentages: true,
      extendLines: false,
      ...options,
    };
  }

  get fibOptions(): CustomFibOptions {
    return this._fibOptions;
  }

  get options(): CustomFibOptions {
    return this._fibOptions;
  }

  setFibOptions(options: Partial<CustomFibOptions>) {
    (this as any)._fibOptions = { ...this._fibOptions, ...options };
    this.requestUpdate();
  }

  isValid(): boolean {
    return this._anchors.length >= 2;
  }

  paneViews(): IPrimitivePaneView[] {
    return [new CustomFibPaneView(this)];
  }

  computeGeometry(viewport: Viewport): Geometry[] {
    if (!this.isValid()) return [];
    const startPx = this.anchorToPixel(this._anchors[0], viewport);
    const endPx = this.anchorToPixel(this._anchors[1], viewport);
    if (!startPx || !endPx) return [];

    const geometries: Geometry[] = [];
    const levels = this._fibOptions.levels ?? CUSTOM_FIB_LEVELS;
    const startPrice = this._anchors[0].price;
    const endPrice = this._anchors[1].price;
    const priceDiff = endPrice - startPrice;

    const leftX = Math.min(startPx.x, endPx.x);
    const extendX = leftX + 1000;

    for (const level of levels) {
      const price = startPrice + priceDiff * level;
      const y = viewport.priceScale.priceToCoordinate(price);
      if (y !== null) {
        geometries.push({
          type: "line",
          start: { x: leftX, y },
          end: { x: extendX, y },
        });
      }
    }
    return geometries;
  }

  testHit(point: Point, viewport: Viewport): boolean {
    if (!this.isValid()) return false;
    const startPx = this.anchorToPixel(this._anchors[0], viewport);
    const endPx = this.anchorToPixel(this._anchors[1], viewport);
    if (!startPx || !endPx) return false;

    const leftX = Math.min(startPx.x, endPx.x);
    const rightX = Math.max(startPx.x, endPx.x);
    const levels = this._fibOptions.levels ?? CUSTOM_FIB_LEVELS;
    const startPrice = this._anchors[0].price;
    const endPrice = this._anchors[1].price;

    for (const level of levels) {
      const price = startPrice + (endPrice - startPrice) * level;
      const y = viewport.priceScale.priceToCoordinate(price);
      if (
        y !== null &&
        point.x >= leftX &&
        point.x <= rightX &&
        Math.abs(point.y - y) <= this.HIT_THRESHOLD
      ) {
        return true;
      }
    }
    return false;
  }

  clone(newId: string): IDrawing {
    return new CustomFibRetracement(
      newId,
      [...this._anchors],
      { ...this._style },
      { ...this._fibOptions },
    );
  }

  static create(
    id: string,
    start: Anchor,
    end: Anchor,
    style?: Partial<DrawingStyle>,
    options?: Partial<CustomFibOptions>,
  ): CustomFibRetracement {
    return new CustomFibRetracement(id, [start, end], style, options);
  }
}

export function registerCustomFibTool() {
  const registry = getToolRegistry();
  registry.register({
    type: "custom-fib-retracement",
    name: "Custom Fib",
    category: "fibonacci",
    requiredAnchors: 2,
    factory: (id, anchors, style, options) =>
      new CustomFibRetracement(
        id,
        (anchors ?? []),
        (style ?? {}),
        (options ?? {}),
      ),
  });
}

export { CUSTOM_FIB_LEVELS, ZONE_DOWN_COLOR, ZONE_UP_COLOR, ZONE_LOWER_COLOR, ZONE_UPPER_COLOR };
