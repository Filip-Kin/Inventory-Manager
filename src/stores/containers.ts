import { writable } from "svelte/store";
import type { Item } from "./items";

let initialContainer = localStorage.getItem('containers');

export interface Container {
    tag: string;
    name: string;
    location: string;
    containerAsItem: Item;
}

export const containerStore = writable<Container[]>(initialContainer ? JSON.parse(initialContainer) : []);

containerStore.subscribe(value => {
    localStorage.setItem('containers', JSON.stringify(value));
});
