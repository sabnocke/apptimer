export type ContextMenuData<T> = {
    x: number;
    y: number;
    item: T;
}

class UIState<T> {
    public menu = $state<ContextMenuData<T> | null>(null);

    public activeModal = $state<string | null>(null); // "rule-editor" | "details" | null
    public modalData = $state<any>(null);

    public openMenu(e: MouseEvent, item: any): void {
        e.preventDefault();
        this.menu = {
            x: e.clientX,
            y: e.clientY,
            item
        };
    }

    public closeMenu() {
        this.menu = null;
    }

    public openModal(id: string, data: any = null) {
        this.closeMenu();
        this.modalData = data;
        this.activeModal = id;
    }

    public closeModal() {
        this.activeModal = null;
        this.modalData = null;
    }
}

export const uiState = new UIState<any>();