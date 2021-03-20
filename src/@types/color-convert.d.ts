declare module 'color-convert' {
    export = convert;
    const convert: Record<string, {
        channels: number,
        labels: string | string[],
        rgb: (args: string) => [r: number, g: number, b: number],
        hex: (args: [r: number, g: number, b: number]) => string,
        hsv: (args: string) => [h: number, s: number, v: number]
    }>
}