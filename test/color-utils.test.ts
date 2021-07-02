import { safeHexColor } from "../src/utils/color-utils";

describe("safeHexColor tests", function () {
    it("valid hex color", async () => {
        const color = "#5536FA";
        expect(safeHexColor(color)).toEqual(color);
    });
    it("undefined color", async () => {
        const color = undefined;
        expect(safeHexColor(color)).toEqual("");
    });
    it("rgb color", async () => {
        const color = "rgb(85, 54, 250)";
        expect(safeHexColor(color)).toEqual("#5536FA");
    });
    it("invalid color", async () => {
        const color = "rgb(85, 54, AA)";
        expect(safeHexColor(color)).toEqual("");
    });
});
