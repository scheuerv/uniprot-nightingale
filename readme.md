# uniprot-nightingale

A tool for visualization of protein sequence and its annotations.

## Build and run

```bash
npm i
npm run start
```

Open your browser on http://localhost:1340/.

## Usage

```typescript
import { TrackManagerBuilder } from "uniprot-nightingale/lib/index";
const trackManagerBuilder: TrackManagerBuilder = TrackManagerBuilder.createDefault({
    sequence: {
        uniprotId: "P37840"
    }
});
const root = document.getElementById("root");
const trackManager = await trackManagerBuilder.load(this.nightingaleWrapper);

this.trackManager.onSelectedStructure.on(async (output) =>
    console.log(output.pdbId);
);

this.trackManager.onResidueMouseOver.on(async (resNum) => {
    console.log(resNum);
});
```

## How to publish on npm

```bash
rm -r lib
tsc -p .\tsconfig.prod.json
#increase version in package.json
cp src/main.css lib/
npm publish
```
