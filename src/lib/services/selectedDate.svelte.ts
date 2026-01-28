import {dataSource} from "$lib/services/dataProvider.svelte";

class SelectedDateSvelte {
    value: Date = $state(SelectedDateSvelte.getTodayMidnight());
    get isToday(): boolean {
        return this.value.toDateString() === new Date().toDateString();
    }

    static getTodayMidnight(): Date {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }

    set(offset: number): this {
        const copy = new Date(this.value);

        copy.setDate(copy.getDate() + offset);
        copy.setHours(0, 0, 0, 0);

        this.value = copy;
        dataSource.loadSpecific(copy);
        return this;
    }

    setToday(): this {
        this.value = SelectedDateSvelte.getTodayMidnight();
        dataSource.loadSpecific(this.value);
        return this;
    }

    inc(): this {
        return this.set(+1);
    }

    dec(): this {
        return this.set(-1);
    }
}

export const selectedDate = new SelectedDateSvelte();