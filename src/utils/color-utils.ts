import ColorConvert from "color-convert";
export function safeHexColor(color?: string) {
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
