/*
 * Copyright (c) 2026 MetaclassMethod
 */

// Additional logic by sleitnick

interface Rgb {
    r: number;
    g: number;
    b: number;
}

const SHORTHAND_RE = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
const HEX_RE = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

export function hexToRgb(hex: string): Rgb | null {
    const expanded = hex.replace(SHORTHAND_RE, (_, r, g, b) => r + r + g + g + b + b);
    const result = HEX_RE.exec(expanded);
    if (!result) return null;

    return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    };
}

function luminance({ r, g, b }: Rgb): number {
    const [lr, lg, lb] = [r, g, b].map(channel => {
        const v = channel / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return lr * 0.2126 + lg * 0.7152 + lb * 0.0722;
}

export function contrastRatio(a: Rgb, b: Rgb): number {
    const lumA = luminance(a);
    const lumB = luminance(b);
    const brightest = Math.max(lumA, lumB);
    const darkest = Math.min(lumA, lumB);
    return (brightest + 0.05) / (darkest + 0.05);
}

export interface ContrastOptions {
    enabled: boolean;
    background: string;
    threshold: number;
}

export function acceptableContrast(colour: string | null | undefined, options: ContrastOptions): boolean {
    if (!colour) return false;
    if (!options.enabled) return true;

    const fg = hexToRgb(colour);
    const bg = hexToRgb(options.background);
    if (!fg || !bg) return false;

    return contrastRatio(fg, bg) >= options.threshold;
}

const WHITE = "#ffffff";
const BLACK = "#000000";

function rgbToHex({ r, g, b }: Rgb): string {
    const channel = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0");
    return `#${channel(r)}${channel(g)}${channel(b)}`;
}

function mix(colour: Rgb, target: Rgb, amount: number): Rgb {
    return {
        r: colour.r + (target.r - colour.r) * amount,
        g: colour.g + (target.g - colour.g) * amount,
        b: colour.b + (target.b - colour.b) * amount
    };
}

export function adjustForLegibility(background: string, text: string, minRatio: number): string {
    const bg = hexToRgb(background);
    const fg = hexToRgb(text);
    if (!bg || !fg) return background;

    const target = luminance(fg) >= luminance(bg) ? hexToRgb(BLACK)! : hexToRgb(WHITE)!;

    const STEPS = 20;
    for (let step = 0; step <= STEPS; step++) {
        const candidate = mix(bg, target, step / STEPS);
        if (contrastRatio(candidate, fg) >= minRatio) return rgbToHex(candidate);
    }

    return rgbToHex(target);
}
