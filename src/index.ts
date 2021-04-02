// original PV components
import ProtvistaManager from "protvista-manager";
import ProtvistaSequence from "protvista-sequence";

import VariationFilter from "./protvista/variation-filter";
import ProtvistaNavigation from "protvista-navigation";
import ProtvistaTooltip from "protvista-tooltip";
import LimitedTrack from "./protvista/limited-track";

import { loadComponent } from "./utils";

import TrackManager from "./manager/track-manager";
import './main.css';
import VariationGraph from "./protvista/variation-graph";
import ProtvistaVariation from "protvista-variation";
import '@fortawesome/fontawesome-free/css/all.css';


const registerWebComponents = function () {
    loadComponent("protvista-manager", ProtvistaManager);
    loadComponent("protvista-filter", VariationFilter);
    loadComponent("protvista-sequence", ProtvistaSequence);
    loadComponent("protvista-track", LimitedTrack);
    loadComponent("protvista-navigation", ProtvistaNavigation);
    loadComponent("protvista-tooltip", ProtvistaTooltip);
    loadComponent("protvista-variation-graph", VariationGraph);
    loadComponent("protvista-variation", ProtvistaVariation);
}

// Conditional loading of polyfill
if (window.customElements) {
    registerWebComponents();
} else {
    document.addEventListener('WebComponentsReady', function () {
        registerWebComponents();
    });
}

export {
    TrackManager
}