import {Timing} from "$lib/types/timing";

export interface SingleEntry {
    id: number,
    title: string,
    time: Timing
}

interface IGanttRow {
    id : number | string        // Id of row, every row needs to have a unique one. (required)
    classes: string | string[]  // Custom CSS classes to apply to row.
    contentHtml: string         // Html content of row, renders as background to a row.
    enableDragging: boolean     // enable dragging of tasks to and from this row.
    enableResize: boolean       // enable resize of tasks on this row.c
    label: string               // Label of row, could be any other property, can be displayed with SvelteGanttTable.
    headerHtml: string          // Html content of table row header, displayed in SvelteGanttTable.c
    children: object[]          // List of children row objects, these can have their own children.
    expanded: boolean           // Used when tree view is enabled, controls the expanded state.
    height: number              // The height of the row.
}

export class GanttRow implements IGanttRow {
    static idProvider = 0;
    id : number | string
    classes: string | string[] = ""
    contentHtml: string = ""
    enableDragging: boolean = true
    enableResize: boolean = true
    label: string
    headerHtml: string = ""
    children: GanttRow[] = []
    expanded: boolean = false
    height: number = 52
    constructor(label: string) {
        this.id = GanttRow.idProvider++
        this.label = label;
    }
}