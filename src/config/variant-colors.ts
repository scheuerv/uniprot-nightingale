import * as d3 from "d3";
export const VariantColors = {
    UPDiseaseColor: "#990000",
    deleteriousColor: "#002594",
    benignColor: "#8FE3FF",
    UPNonDiseaseColor: "#99cc00",
    othersColor: "#FFCC00",
    unknownColor: "#808080",
    consequenceColors: [
        "#66c2a5",
        "#8da0cb",
        "#e78ac3",
        "#e5c494",
        "#fc8d62",
        "#ffd92f",
        "#a6d854",
        "#b3b3b3"
    ],

    getPredictionColor: d3.scaleLinear<string>().domain([0, 1]).range(["#002594", "#8FE3FF"])
};
