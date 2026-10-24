/// <reference types="@figma/plugin-typings" />

import { evaluateContrast, figmaRgbToSrgb, type ContrastResult } from './contrast';

figma.showUI(__html__, { width: 360, height: 420, themeColors: true });

function solidFill(node: SceneNode): RGB | null {
  if (!('fills' in node) || node.fills === figma.mixed) return null;
  const fills = node.fills as readonly Paint[];
  for (const fill of fills) {
    if (fill.type === 'SOLID' && fill.visible !== false) {
      return fill.color;
    }
  }
  return null;
}

function pageBackground(): RGB {
  // Approximate white canvas; Figma has no single page bg API for all cases
  return { r: 1, g: 1, b: 1 };
}

function runCheck(): ContrastResult | { error: string } {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    return { error: 'Select one filled layer (or two to compare fills).' };
  }

  const fgColor = solidFill(selection[0]!);
  if (!fgColor) {
    return { error: 'First selection needs a solid fill (or text with solid fill).' };
  }

  let bgColor: RGB;
  if (selection.length >= 2) {
    const second = solidFill(selection[1]!);
    if (!second) {
      return { error: 'Second selection needs a solid fill to use as background.' };
    }
    bgColor = second;
  } else {
    bgColor = pageBackground();
  }

  return evaluateContrast(figmaRgbToSrgb(fgColor), figmaRgbToSrgb(bgColor));
}

figma.ui.onmessage = (msg: { type: string }) => {
  if (msg.type === 'check') {
    const result = runCheck();
    figma.ui.postMessage({ type: 'result', result });
  }
  if (msg.type === 'close') {
    figma.closePlugin();
  }
};
