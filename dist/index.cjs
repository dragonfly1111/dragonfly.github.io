'use strict';

var core = require('@leafer-ui/core');

var Position;
(function (Position) {
    Position["LEFT"] = "left";
    Position["RIGHT"] = "right";
    Position["TOP"] = "top";
    Position["BOTTOM"] = "bottom";
    Position["CENTER_X"] = "centerX";
    Position["CENTER_Y"] = "centerY";
    Position["LEFT_OVERLAP"] = "leftOverlap";
    Position["RIGHT_OVERLAP"] = "rightOverlap";
    Position["TOP_OVERLAP"] = "topOverlap";
    Position["BOTTOM_OVERLAP"] = "bottomOverlap";
    Position["TARGET_CENTER_Y_TOP"] = "targetCenterYTop";
    Position["TARGET_CENTER_Y_BOTTOM"] = "targetCenterYBottom";
    Position["TARGET_CENTER_X_LEFT"] = "targetCenterXLeft";
    Position["TARGET_CENTER_X_RIGHT"] = "targetCenterXRight";
})(Position || (Position = {}));
var GutterPosition;
(function (GutterPosition) {
    GutterPosition["LEFT"] = "l2r";
    GutterPosition["RIGHT"] = "r2l";
    GutterPosition["TOP"] = "t2b";
    GutterPosition["BOTTOM"] = "b2t";
})(GutterPosition || (GutterPosition = {}));
const DEFAULT_COLOR = 'rgb(255,0,0)';
const DEFAULT_GUTTER_NUM = 5;
const DEFAULT_LINE_NUM = 5;
const DEFAULT_FONT_SIZE = 12;
const DEFAULT_GUTTER_STOCK_WIDTH = 2;
const DEFAULT_LINE_STOCK_WIDTH = 1;
const DEFAULT_GUTTER_ADS = 6;
const DEFAULT_LINE_ADS = 10;
const DEFAULT_BG_COLOR = 'rgba(255,156,156,0.16)';
class ReferenceLine {
    constructor(app, gutterOptions, lineOptions) {
        this.app = app;
        this.referenceLeafer = app.addLeafer();
        this.gutterOptions = {
            showGutter: gutterOptions.hasOwnProperty("showGutter") ? gutterOptions.showGutter : true,
            showGutterNum: gutterOptions.showGutterNum || DEFAULT_GUTTER_NUM,
            fill: gutterOptions.fill || DEFAULT_COLOR,
            fontSize: gutterOptions.fontSize || DEFAULT_FONT_SIZE,
            stroke: gutterOptions.stroke || DEFAULT_COLOR,
            strokeWidth: gutterOptions.strokeWidth || DEFAULT_GUTTER_STOCK_WIDTH,
            startArrow: gutterOptions.startArrow || 'mark',
            endArrow: gutterOptions.endArrow || 'mark',
            gutterAdsorption: gutterOptions.gutterAdsorption || DEFAULT_GUTTER_ADS,
            gutterArr: gutterOptions.gutterArr || [12, 32, 64, 128],
            showBg: gutterOptions.hasOwnProperty("showBg") ? gutterOptions.showBg : true,
            bgColor: gutterOptions.bgColor || DEFAULT_BG_COLOR,
        };
        this.lineOptions = {
            showLine: lineOptions.hasOwnProperty("showLine") ? lineOptions.showLine : true,
            showLineNum: lineOptions.showLineNum || DEFAULT_LINE_NUM,
            adsorption: lineOptions.adsorption || DEFAULT_LINE_ADS,
            stroke: lineOptions.stroke || DEFAULT_COLOR,
            strokeWidth: lineOptions.strokeWidth || DEFAULT_LINE_STOCK_WIDTH,
        };
        this.pointMap = new Map();
        this.zoomHandler = this.zoomHandler.bind(this);
        this.app.tree.on(core.ZoomEvent.ZOOM, this.zoomHandler);
        this.treeListen(app.tree);
        this.initCenterMap();
    }
    initCenterMap() {
        this.app.tree.children.forEach(item => {
            const bounds = this.getPoints(item.getBounds('content', 'page'));
            this.pointMap.set(item.innerId, bounds);
        });
    }
    getPoints(bounds) {
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        return {
            centerX,
            centerY,
            x: bounds.x,
            y: bounds.y,
            x1: bounds.x + bounds.width,
            y1: bounds.y + bounds.height
        };
    }
    getXOffset(bounds) {
        const minX = Math.min(...bounds.map(point => point.x));
        return bounds[0].x - minX;
    }
    getYOffset(bounds) {
        const minY = Math.min(...bounds.map(point => point.y));
        return bounds[0].y - minY;
    }
    getXOffset1(bounds) {
        const maxX = Math.max(...bounds.map(point => point.x));
        return maxX - bounds[0].x;
    }
    getYOffset1(bounds) {
        const maxY = Math.max(...bounds.map(point => point.y));
        return maxY - bounds[0].y;
    }
    drawLine(type, num, position, target) {
        const bounds = this.getPoints(target.getBounds('content', 'page'));
        const xOffset = this.getXOffset(target.getLayoutPoints('content', 'page'));
        const yOffset = this.getYOffset(target.getLayoutPoints('content', 'page'));
        if (type === 'row') {
            this.line = new core.Line({
                x: -10000,
                y: num,
                width: 20000,
                strokeWidth: this.lineOptions.strokeWidth,
                stroke: this.lineOptions.stroke,
            });
            switch (position) {
                case Position.TOP:
                case Position.BOTTOM_OVERLAP:
                    target.y = num + yOffset;
                    break;
                case Position.BOTTOM:
                case Position.TOP_OVERLAP:
                    target.y = num - (bounds.y1 - bounds.y) + yOffset;
                    break;
                case Position.CENTER_Y:
                case Position.TARGET_CENTER_Y_TOP:
                case Position.TARGET_CENTER_Y_BOTTOM:
                    target.y = num - (bounds.y1 - bounds.y) / 2 + yOffset;
                    break;
            }
        }
        else {
            this.line = new core.Line({
                x: num,
                y: -10000,
                width: 20000,
                rotation: 90,
                strokeWidth: 1,
                stroke: this.lineOptions.stroke
            });
            switch (position) {
                case Position.CENTER_X:
                case Position.TARGET_CENTER_X_LEFT:
                case Position.TARGET_CENTER_X_RIGHT:
                    target.x = num - (bounds.x1 - bounds.x) / 2 + xOffset;
                    break;
                case Position.LEFT:
                case Position.LEFT_OVERLAP:
                    target.x = num + xOffset;
                    break;
                case Position.RIGHT:
                case Position.RIGHT_OVERLAP:
                    target.x = num - (bounds.x1 - bounds.x) + xOffset;
                    break;
            }
        }
        this.referenceLeafer.add(this.line);
    }
    drawArrow(obj, target) {
        const xOffset = this.getXOffset(target.getLayoutPoints('content', 'page'));
        const yOffset = this.getYOffset(target.getLayoutPoints('content', 'page'));
        const xOffset1 = this.getXOffset1(target.getLayoutPoints('content', 'page'));
        const yOffset1 = this.getYOffset1(target.getLayoutPoints('content', 'page'));
        let text, reactObj;
        if (obj.type === 'row') {
            if (obj.position === GutterPosition.LEFT) {
                target.x = obj.x - xOffset1;
            }
            else {
                target.x = obj.x + obj.gutter + xOffset;
            }
            text = new core.Text({
                x: obj.x + obj.gutter / 2,
                y: obj.y,
                fill: this.gutterOptions.fill,
                fontSize: this.gutterOptions.fontSize,
                textAlign: 'center',
                text: obj.gutter.toString()
            });
            reactObj = {
                width: obj.gutter,
                height: 20000,
                y: -10000,
                x: obj.x,
                fill: this.gutterOptions.bgColor,
                zIndex: -1
            };
        }
        else if (obj.type === 'vertical') {
            if (obj.position === GutterPosition.TOP) {
                target.y = obj.y - yOffset1;
            }
            else {
                target.y = obj.y + obj.gutter + yOffset;
            }
            text = new core.Text({
                x: obj.x + this.gutterOptions.fontSize,
                y: obj.y + obj.gutter / 2 - (this.gutterOptions.fontSize * 1.5) / 2,
                fill: this.gutterOptions.fill,
                fontSize: this.gutterOptions.fontSize,
                textAlign: 'center',
                text: obj.gutter.toString()
            });
            reactObj = {
                width: 20000,
                x: -10000,
                height: obj.gutter,
                y: obj.y,
                fill: this.gutterOptions.bgColor,
                zIndex: -1
            };
        }
        if (text) {
            this.referenceLeafer.add(text);
        }
        if (this.gutterOptions.showBg) {
            const rect = new core.Rect(reactObj);
            this.referenceLeafer.add(rect);
        }
    }
    getCloseEle(n, target, targetBounds) {
        let closestPoints = [];
        const closestPointsTmp = [];
        const distances = [];
        this.pointMap.forEach((point, id) => {
            if (id !== target.innerId) {
                const distance = Math.sqrt(Math.pow(point.centerX - targetBounds.centerX, 2) + Math.pow(point.centerY - targetBounds.centerY, 2));
                distances.push({ point, distance });
            }
        });
        distances.sort((a, b) => a.distance - b.distance);
        for (let i = 0; i < Math.min(n, distances.length); i++) {
            closestPointsTmp.push(distances[i].point);
        }
        closestPoints = closestPointsTmp;
        console.log('closestPoints');
        console.log(closestPoints);
        return closestPoints;
    }
    treeListen(leafer) {
        leafer.on(core.DragEvent.DRAG, (e) => {
            this.referenceLeafer.clear();
            if (this.lineOptions.showLine) {
                this.calcOverlap(e.target);
            }
            if (this.gutterOptions.showGutter) {
                this.calcGutter(e.target);
            }
        });
        leafer.on(core.DragEvent.END, () => {
            this.referenceLeafer.clear();
            this.initCenterMap();
        });
    }
    calcOverlap(target) {
        const targetBounds = this.getPoints(target.getBounds('content', 'page'));
        const overlapPoints = [];
        const closestPoints = this.getCloseEle(this.lineOptions.showLineNum, target, targetBounds);
        closestPoints.forEach((point, id) => {
            if (id !== target.innerId) {
                if (Math.abs(point.x - targetBounds.x) <= this.lineOptions.adsorption) {
                    overlapPoints.push({
                        type: 'vertical',
                        value: point.x,
                        position: Position.LEFT
                    });
                }
                if (Math.abs(point.x1 - targetBounds.x1) <= this.lineOptions.adsorption) {
                    overlapPoints.push({
                        type: 'vertical',
                        value: point.x1,
                        position: Position.RIGHT
                    });
                }
                if (Math.abs(point.y - targetBounds.y) <= this.lineOptions.adsorption) {
                    overlapPoints.push({
                        type: 'row',
                        value: point.y,
                        position: Position.TOP
                    });
                }
                if (Math.abs(point.y1 - targetBounds.y1) <= this.lineOptions.adsorption) {
                    overlapPoints.push({
                        type: 'row',
                        value: point.y1,
                        position: Position.BOTTOM
                    });
                }
                if (Math.abs(point.centerX - targetBounds.centerX) <= this.lineOptions.adsorption) {
                    overlapPoints.push({
                        type: 'vertical',
                        value: point.centerX,
                        position: Position.CENTER_X
                    });
                }
                if (Math.abs(point.centerY - targetBounds.centerY) <= this.lineOptions.adsorption) {
                    overlapPoints.push({
                        type: 'row',
                        value: point.centerY,
                        position: Position.CENTER_Y
                    });
                }
                if (Math.abs(point.x - targetBounds.x1) <= this.lineOptions.adsorption) {
                    overlapPoints.push({
                        type: 'vertical',
                        value: point.x,
                        position: Position.RIGHT_OVERLAP
                    });
                }
                if (Math.abs(point.x1 - targetBounds.x) <= this.lineOptions.adsorption) {
                    overlapPoints.push({
                        type: 'vertical',
                        value: point.x1,
                        position: Position.LEFT_OVERLAP
                    });
                }
                if (Math.abs(point.y - targetBounds.y1) <= this.lineOptions.adsorption) {
                    overlapPoints.push({
                        type: 'row',
                        value: point.y,
                        position: Position.TOP_OVERLAP
                    });
                }
                if (Math.abs(point.y1 - targetBounds.y) <= this.lineOptions.adsorption) {
                    overlapPoints.push({
                        type: 'row',
                        value: point.y1,
                        position: Position.BOTTOM_OVERLAP
                    });
                }
                if (Math.abs(targetBounds.centerY - point.y) <= this.lineOptions.adsorption) {
                    overlapPoints.push({
                        type: 'row',
                        value: point.y,
                        position: Position.TARGET_CENTER_Y_TOP
                    });
                }
                if (Math.abs(targetBounds.centerY - point.y1) <= this.lineOptions.adsorption) {
                    overlapPoints.push({
                        type: 'row',
                        value: point.y1,
                        position: Position.TARGET_CENTER_Y_BOTTOM
                    });
                }
                if (Math.abs(targetBounds.centerX - point.x) <= this.lineOptions.adsorption) {
                    overlapPoints.push({
                        type: 'vertical',
                        value: point.x,
                        position: Position.TARGET_CENTER_X_LEFT
                    });
                }
                if (Math.abs(targetBounds.centerX - point.x1) <= this.lineOptions.adsorption) {
                    overlapPoints.push({
                        type: 'vertical',
                        value: point.x1,
                        position: Position.TARGET_CENTER_X_RIGHT
                    });
                }
            }
        });
        overlapPoints.forEach(item => {
            this.drawLine(item.type, item.value, item.position, target);
        });
    }
    calcGutter(target) {
        const overlapPoints = [];
        const targetBounds = this.getPoints(target.getBounds('content', 'page'));
        const closestPoints = this.getCloseEle(this.gutterOptions.showGutterNum, target, targetBounds);
        closestPoints.forEach((point, id) => {
            if (id !== target.innerId) {
                this.gutterOptions.gutterArr.forEach(gutter => {
                    if (Math.abs(point.x - targetBounds.x1 - gutter) <= this.gutterOptions.gutterAdsorption) {
                        overlapPoints.push({
                            gutter,
                            position: GutterPosition.LEFT,
                            type: 'row',
                            x: point.x - gutter,
                            y: targetBounds.centerY
                        });
                    }
                    if (Math.abs(targetBounds.x - point.x1 - gutter) <= this.gutterOptions.gutterAdsorption) {
                        overlapPoints.push({
                            gutter,
                            position: GutterPosition.RIGHT,
                            type: 'row',
                            x: point.x1,
                            y: targetBounds.centerY
                        });
                    }
                    if (Math.abs(point.y - targetBounds.y1 - gutter) <= this.gutterOptions.gutterAdsorption) {
                        overlapPoints.push({
                            gutter,
                            position: GutterPosition.TOP,
                            type: 'vertical',
                            x: targetBounds.centerX,
                            y: point.y - gutter
                        });
                    }
                    if (Math.abs(targetBounds.y - point.y1 - gutter) <= this.gutterOptions.gutterAdsorption) {
                        overlapPoints.push({
                            gutter,
                            position: GutterPosition.BOTTOM,
                            type: 'vertical',
                            x: targetBounds.centerX,
                            y: point.y1
                        });
                    }
                });
            }
        });
        overlapPoints.forEach(item => {
            this.drawArrow(item, target);
        });
    }
    zoomHandler() {
        this.initCenterMap();
    }
    changeGutterStatus(val) {
        this.gutterOptions.showGutter = val;
    }
    changeLineStatus(val) {
        this.lineOptions.showLine = val;
    }
}

exports.ReferenceLine = ReferenceLine;
