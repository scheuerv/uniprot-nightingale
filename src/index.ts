// original PV components
import ProtvistaManager from "protvista-manager";
import ProtvistaSequence from "protvista-sequence";

import VariationFilter from "./protvista/variation-filter";
import ProtvistaNavigation from "protvista-navigation";
import LimitedTrack from "./protvista/limited-track";

import { loadComponent } from "./utils/utils";

import "./main.css";
import FixedVariationGraph from "./protvista/variation-graph";
import FixedProtvistaVariation from "./protvista/variation";
import "@fortawesome/fontawesome-free/css/all.css";
import TrackManagerBuilder from "./manager/builder/track-manager-builder";
import CloseableTooltip from "./protvista/closeable-tooltip";

const registerWebComponents = function () {
    loadComponent("protvista-manager", ProtvistaManager);
    loadComponent("protvista-filter", VariationFilter);
    loadComponent("protvista-sequence", ProtvistaSequence);
    loadComponent("protvista-track", LimitedTrack);
    loadComponent("protvista-navigation", ProtvistaNavigation);
    loadComponent("protvista-tooltip", CloseableTooltip);
    loadComponent("protvista-variation-graph", FixedVariationGraph);
    loadComponent("protvista-variation", FixedProtvistaVariation);
};

// Conditional loading of polyfill
if (window.customElements) {
    registerWebComponents();
} else {
    document.addEventListener("WebComponentsReady", function () {
        registerWebComponents();
    });
}

export { TrackManagerBuilder };
