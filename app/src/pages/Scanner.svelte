<script lang="ts">
    import { onMount } from "svelte";
    import {
        Button,
        ButtonGroup,
        Checkbox,
        Modal,
        Label,
        Input,
        Select,
        Table,
        TableBody,
        TableBodyCell,
        TableBodyRow,
        TableHead,
        TableHeadCell,
    } from "flowbite-svelte";
    import { itemStore, type Item } from "../stores/items";
    import { get } from "svelte/store";
    import { containerStore, type Container } from "../stores/containers";

    let video: HTMLVideoElement;
    let canvas: HTMLCanvasElement;
    export let mode: "checkin" | "checkout" | "create" | "edit";

    let items: Item[] = get(itemStore);
    let containers: Container[] = get(containerStore);

    let currentContainerTag: string = containers[0]?.tag || "";
    let currentContainer: Container | undefined;
    let currentContainerItems: Item[] = items.filter(
        (i) => i.container === currentContainer?.tag,
    );

    $: {
        currentContainer = containers.find(
            (c) => c.tag === currentContainerTag,
        );
        currentContainerItems = items.filter(
            (i) => i.container === currentContainer?.tag,
        );
    }

    let tag: string;

    if (!mode) mode = "checkin";

    console.log(mode);

    function launchBarcodeScanner() {
        // @ts-ignore
        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia ||
            !window.BarcodeDetector
        ) {
            //alert("Your device does not support the Barcode Detection API. Try again on Chrome Desktop or Android");
        } else {
            startDetection();
        }
    }

    async function startDetection() {
        //we start the device's camera
        let stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
        });
        video.srcObject = stream;
        video.play();

        //for the purpose of this demo, we're only detecting QR codes, but there are plenty of other barcodes formats we could detect
        //see https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API#supported_barcode_formats
        // @ts-ignore
        let barcodeDetector = new BarcodeDetector({ formats: ["qr_code"] });

        video.addEventListener("loadedmetadata", async function () {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            let context = canvas.getContext("2d");

            let checkForQrCode = async function () {
                if (!context) throw new Error("Context for canvas missing");
                //we draw the current view from the camera on a canvas
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                //then we pass that canvas to the barcode detector
                let barcodes = await barcodeDetector.detect(canvas);

                if (barcodes.length > 0) {
                    let barcodeData = barcodes[0].rawValue;
                    alert(
                        "Detected QR code with the following content: " +
                            barcodeData,
                    );
                }

                requestAnimationFrame(checkForQrCode);
            };

            checkForQrCode();
        });
    }

    onMount(launchBarcodeScanner);

    let createItemModal = false;
    let itemToCreate = {
        tag: "",
        make: "",
        model: "",
        description: "",
        serial: "",
        container: "",
        isContainer: false,
        value: undefined,
    };

    async function createItem() {
        // Add to database and send to server
        const newItem = {
            ...itemToCreate,
            checkedOut: false,
        };
        console.log(newItem);
        items.push(newItem);

        items = items;
        itemStore.set(items);

        if (itemToCreate.isContainer) {
            containers.push({
                tag: itemToCreate.tag,
                name: itemToCreate.description,
                location: "",
                containerAsItem: newItem
            });
            containers = containers;
            containerStore.set(containers);
        }

        await fetch('https://inventory.app.filipkin.com/create/'+itemToCreate.tag, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(itemToCreate)
        });

        createItemModal = false;
        disableInputs = false;

        itemToCreate = {
            tag: "",
            make: "",
            model: "",
            description: "",
            serial: "",
            container: "",
            isContainer: false,
            value: undefined,
        };
    }

    async function scanCode(evt: Event) {
        evt.preventDefault();
        disableInputs = true;
        console.log(tag);

        if (mode === "create") {
            itemToCreate.tag = tag;
            itemToCreate.container = currentContainerTag;
            createItemModal = true;
        } else if (mode === 'checkin') {
            const item = items.find((i) => i.tag === tag);
            if (item) {
                item.checkedOut = false;
                items = items;
                itemStore.set(items);
                await fetch('https://inventory.app.filipkin.com/checkin/'+tag, {
                    method: 'POST'
                });
            }
            disableInputs = false;
        } else if (mode === 'checkout') {
            const item = items.find((i) => i.tag === tag);
            if (item) {
                item.checkedOut = true;
                items = items;
                itemStore.set(items);
                await fetch('https://inventory.app.filipkin.com/checkout/'+tag, {
                    method: 'POST'
                });
            }
            disableInputs = false;
        } else if (mode === 'edit') {
            // const item = items.find((i) => i.tag === tag);
            // if (item) {
            //     itemToCreate = item;
            //     createItemModal = true;
            // }
            disableInputs = false;
        }
    }

    let disableInputs = false;

    async function checkInOut(evt: Event) {
        const target = evt.target as HTMLButtonElement;
        const tag = target.parentElement?.parentElement?.id.substring(8) || "";
        console.log(tag);
        const item = items.find((i) => i.tag === tag);
        if (item) {
            item.checkedOut = !item.checkedOut;
            items = items;
            itemStore.set(items);
            if (item.checkedOut) {
                await fetch('https://inventory.app.filipkin.com/checkout/'+tag, {
                    method: 'POST'
                });
            } else {
                await fetch('https://inventory.app.filipkin.com/checkin/'+tag, {
                    method: 'POST'
                });
            }
        }
    }
</script>

<Modal bind:open={createItemModal}>
    <div slot="header">
        <h1 class="text-xl">Create Item</h1>
    </div>
    <form>
        <div class="grid gap-6 mb-6 md:grid-cols-2">
            <div class="col-span-2">
                <Label>Tag</Label>
                <Input bind:value={itemToCreate.tag} />
            </div>
            <div class="col-span-2">
                <Label>Description</Label>
                <Input bind:value={itemToCreate.description} />
            </div>
            <div>
                <Label>Make</Label>
                <Input bind:value={itemToCreate.make} />
            </div>
            <div>
                <Label>Model</Label>
                <Input bind:value={itemToCreate.model} />
            </div>
            <div>
                <Label>Serial</Label>
                <Input bind:value={itemToCreate.serial} />
            </div>
            <div>
                <Label>Value</Label>
                <Input bind:value={itemToCreate.value} />
            </div>
            <div class="col-span-2">
                <Label>Container</Label>
                <Select
                    bind:value={itemToCreate.container}
                    items={containers.map((c) => ({ value: c.tag, name: c.name }))}
                />
            </div>
            <div class="col-span-2">
                <Checkbox bind:checked={itemToCreate.isContainer}>Is Container</Checkbox>
            </div>
        </div>
    </form>
    <div slot="footer" class="flex space-x-2">
        <Button on:click={createItem}>Create</Button>
        <Button
            color="red"
            on:click={() => {
                createItemModal = false;
            }}>Cancel</Button
        >
    </div>
</Modal>

<div class="container">
    <div class="text-gray-900 dark:text-gray-100">
        <ButtonGroup>
            {#if mode == "checkin"}
                <Button color="green" class="rounded-none rounded-l-lg"
                    >Check-in</Button
                >
            {:else}
                <Button
                    outline
                    color="green"
                    class="rounded-none rounded-l-lg"
                    href="/checkin">Check-in</Button
                >
            {/if}
            {#if mode == "checkout"}
                <Button color="red" class="rounded-none">Check-out</Button>
            {:else}
                <Button
                    outline
                    color="red"
                    class="rounded-none"
                    href="/checkout">Check-out</Button
                >
            {/if}
            {#if mode == "create"}
                <Button color="yellow" class="rounded-none">Create</Button>
            {:else}
                <Button
                    outline
                    color="yellow"
                    class="rounded-none"
                    href="/create">Create</Button
                >
            {/if}
            {#if mode == "edit"}
                <Button color="blue" class="rounded-none rounded-r-lg"
                    >Edit</Button
                >
            {:else}
                <Button
                    outline
                    color="blue"
                    class="rounded-none rounded-r-lg"
                    href="/edit">Edit</Button
                >
            {/if}
        </ButtonGroup>
    </div>
    <!-- svelte-ignore a11y-media-has-caption -->
    <video bind:this={video} class="hidden"></video>
    <canvas bind:this={canvas}></canvas>
    <form on:submit={scanCode} class="flex">
        <Input
            bind:value={tag}
            class="rounded-none rounded-l-lg"
            bind:disabled={disableInputs}
        />
        <Button
            type="submit"
            class="rounded-none rounded-r-lg"
            bind:disabled={disableInputs}>Submit</Button
        >
    </form>
    <div class="flex flex-col space-y-2 mt-2">
        <h2 class="text-xl">Container</h2>
        <Select
            bind:value={currentContainerTag}
            items={containers.map((c) => ({ value: c.tag, name: c.name }))}
        />
        {#if currentContainer}
            <Table>
                <TableHead>
                    <TableHeadCell>Tag</TableHeadCell>
                    <TableHeadCell>Make</TableHeadCell>
                    <TableHeadCell>Model</TableHeadCell>
                    <TableHeadCell>Description</TableHeadCell>
                    <TableHeadCell>Check In/Out</TableHeadCell>
                </TableHead>
                <TableBody>
                    {#each currentContainerItems as item}
                        <TableBodyRow color={item.checkedOut ? "red" : "green"} id="itemRow-{item.tag}">
                            <TableBodyCell>{item.tag}</TableBodyCell>
                            <TableBodyCell>{item.make}</TableBodyCell>
                            <TableBodyCell>{item.model}</TableBodyCell>
                            <TableBodyCell>{item.description}</TableBodyCell>
                            <TableBodyCell><Button size="sm" color="dark" class="w-full" on:click={checkInOut}>{item.checkedOut ? 'In': 'Out'}</Button></TableBodyCell>
                        </TableBodyRow>
                    {/each}
                </TableBody>
            </Table>
        {/if}
    </div>
</div>
