const fs = require("fs");
const { dialog } = require("electron").remote;


interface FileWithDate {
    filePath: string,
    dt: number
}

function chooseDirectory() {
    const result = dialog.showOpenDialogSync({
        properties: ["openDirectory"]
    });

    if (result !== undefined && result !== null) {
        document.getElementById("chosenDirectory")!.innerText = result[0];
    }
}

function numberAll(directory: string, startAt: number, force: boolean = false) {
    if (directory == null || directory == "") {
        dialog.showMessageBoxSync({
            type: "warning",
            buttons: ["OK"],
            message: "No folder selected"
        });
        return;
    }

    if (!directory.endsWith("/")) {
        directory = directory + "/";
    }

    let allFiles = fs.readdirSync(directory);
    let filesWithModTime = allFiles.map((filename: string) => {
        let fileStats = fs.statSync(`${directory}${filename}`);
        return {
            filePath: filename,
            dt: fileStats.birthtimeMs
        } as FileWithDate
    });

    let sortedFiles = filesWithModTime.sort((a: FileWithDate, b: FileWithDate) => a.dt - b.dt);

    let highest = getHighest(sortedFiles);

    if (!force && startAt <= highest) {
        dialog.showMessageBoxSync({
            type: "error",
            buttons: ["OK"],
            message: "There are already numbers higher than your selected Starting Number in this folder, which means your 'unique id' will not be unique."
        })
    }


    let maxPad = Math.floor(Math.log10(Math.max(highest, sortedFiles.length)) + 1);

    let next = startAt ?? highest + 1;
    for (let file of sortedFiles) {
        let filename = file.filePath;
        let numberMatch = filename.match(/^\((\d+)\)_/);
        if (numberMatch == null) {
            fs.renameSync(`${directory}${filename}`, `${directory}(${(next.toString()).padStart(maxPad, "0")})_${filename}`);
            next++;
        } else {
            let numString = parseInt(numberMatch[1]).toString();
            let newFilename = filename.replace(/^\(\d+\)/, `(${numString.padStart(maxPad, "0")})`);
            fs.renameSync(`${directory}${filename}`, `${directory}${newFilename}`)
        }
    }

    dialog.showMessageBoxSync({
        type: "info",
        buttons: ["OK"],
        message: "Renaming complete"
    })
}

function deNumberRange(directory: string, startingNumber: number, endNumber: number) {
    if (!directory.endsWith("/")) {
        directory = directory + "/";
    }

    for (let filename of fs.readdirSync(directory)) {
        let numCheck = filename.match(/^\((\d+)/);
        let num: number;

        if (numCheck == null) {
            continue;
        } else {
            num = parseInt(numCheck[1]);
        }

        if (num >= startingNumber && num <= endNumber) {
            let oldPath = `${directory}${filename}`;
            let newFilename = filename.replace(/\(\d+\)_/, "");
            let newPath = `${directory}${newFilename}`;
            fs.renameSync(oldPath, newPath);
        }
    }

    dialog.showMessageBoxSync({
        type: "info",
        buttons: ["OK"],
        message: "Renaming complete"
    })
}

function getHighest(allFiles: Array<FileWithDate>): number {
    let highest = 0;
    for (let file of allFiles) {
        let numberMatch = file.filePath.match(/^\((\d+\))_/);
        if (numberMatch == null) {
            continue;
        }

        let num = parseInt(numberMatch[1]);
        if (num > highest) {
            highest = num;
        }
    }

    return highest;
}

function toggleHidden(divElement: HTMLDivElement) {
    divElement.classList.toggle("hidden")
}
