export default class TooltipContent {
    private title: string;
    private contentRows: Row[] = [];
    constructor(label: string) {
        this.title = label;
    }
    public addRow(label: string, content: string | undefined) {
        if (content) { this.contentRows.push(new Row(label, content)); }
    }
    public render(): string {
        let content = "<table>";
        this.contentRows.forEach(row =>
            content += '<tr> <td>' + row.label + '</td><td>' + row.content + '</td></tr>'
        )
        return content + '</table>';
    }
    public getTitle() {
        return this.title;
    }
}

class Row {
    constructor(public label: string, public content: string) {

    }

}