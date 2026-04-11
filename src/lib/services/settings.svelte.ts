class SettingsSvelte {
    public show_unknown: boolean = true;
    public show_group: boolean = true;
    public show_group_option: "one" | "two" = "one"

    constructor() {
        this.load();
    }

    public aggregate_group(): boolean {
        const a = this.show_group && this.show_group_option === "one";
        return a || this.show_group_option === "one";
    }
    public store() {
        localStorage.setItem("show_unknown", JSON.stringify(this.show_unknown));
        localStorage.setItem("show_group", JSON.stringify(this.show_group));
        localStorage.setItem("show_group_option", JSON.stringify(this.show_group_option));
    }

    public load() {
        this.show_unknown = JSON.parse(localStorage.getItem("show_unknown") || "true");
        this.show_group = JSON.parse(localStorage.getItem("show_group") || "true");
        this.show_group_option = JSON.parse(localStorage.getItem("show_group_option") || "one");
    }

    public invalidate() {
        this.store();
        this.load();
    }
}

export const settings = $state(new SettingsSvelte());