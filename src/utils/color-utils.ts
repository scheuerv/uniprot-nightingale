import ColorConvert from "color-convert";
/**
 * Converts given color to hex format. If the given string is not color in hex or rgb format it returns empty string.
 * @param  {string=} color Color to convert.
 * @returns Hex color string or empty string.
 */
export function safeHexColor(color?: string): string {
    let match = color?.match(/^#[0-9a-f]{3,6}$/i);
    let convertedColor = "";
    if (match) {
        convertedColor = match[0];
    } else {
        match = color?.match(/rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)/);
        if (match) {
            convertedColor =
                "#" +
                ColorConvert.rgb.hex([parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]);
        }
    }
    return convertedColor;
}
