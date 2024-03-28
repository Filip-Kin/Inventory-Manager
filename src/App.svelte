<script lang="ts">
    import { Route, Router } from "svelte-routing";
    import Scanner from "./pages/Scanner.svelte";
    import { get } from "svelte/store";
    import { itemStore, type Item } from "./stores/items";
    import { containerStore, type Container } from "./stores/containers";

    fetch('https://inventory.filipkin.com/inventory').then(res => res.json()).then((data) => {
        console.log(data);
        const localData = get(itemStore);
        const remoteData = data as unknown as Item[];

        const newData = remoteData.map((item: Item) => {
            const existingItem = localData.find(i => i.tag === item.tag);
            if (existingItem && existingItem.checkedOut !== item.checkedOut) {
                console.log('Item conflict', existingItem, item);
            }
            return item;
        });

        const containers: Container[] = newData.filter(i => i.isContainer).map(i => ({ tag: i.tag, name: i.description, location: '', containerAsItem: i }));
        console.log('Containers', containers);
        containerStore.set(containers);

        itemStore.set(newData);
        console.log('Items updated from server');
    });

    itemStore.subscribe((items) => {
        fetch('https://inventory.filipkin.com/inventory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(items)
        }).then(res => res.text()).then((data) => {
            console.log('Items updated on server');
        });
    });
</script>

<main>
    <Router basepath="/">
        <Route path="/" component={Scanner} />
        <Route path="/:mode" component={Scanner} />
    </Router>
</main>
