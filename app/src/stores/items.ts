import { get, writable } from "svelte/store";

let initialItems = localStorage.getItem('items');

export interface Item {
    tag: string;
    make: string;
    description: string;
    model?: string;
    serial?: string;
    container: string;
    checkedOut: boolean;
    isContainer: boolean;
    value?: number;
}

export const itemStore = writable<Item[]>(initialItems ? JSON.parse(initialItems) : []);

itemStore.subscribe(value => {
    localStorage.setItem('items', JSON.stringify(value));
});
