# uniprot-nightingale

A tool for visualization of protein sequence and its annotations.

## Build and run

```bash
npm i
npm run start
```

Open your browser on <http://localhost:1340/>.

## Usage

```typescript
import { TrackManagerBuilder } from "uniprot-nightingale/lib/manager/builder/track-manager-builder";
const trackManagerBuilder: TrackManagerBuilder = TrackManagerBuilder.createDefault({
    uniprotId: "P37840"
});
const root = document.getElementById("root")!;
trackManagerBuilder.load(root).then((trackManager) => {
    trackManager.onSelectedStructure.on(async (output) => console.log(output.pdbId));

    trackManager.onResidueMouseOver.on(async (resNum) => {
        console.log(resNum);
    });
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
