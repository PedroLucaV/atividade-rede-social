import fs from "node:fs"

export const readFile = (callback) => {
    fs.readFile('./users.json', "utf-8", (err, data) => {
        if (err) {
            callback(err)
        }

        try {
            const usuario = JSON.parse(data)
            callback(null, usuario);
        }
        catch (error) {
            callback(error);
        };
    });
};

export const writeFile = (usuario, novoFunc, callback) => {
    fs.writeFile("./users.json", JSON.stringify(usuario, null, 2), (err) => {
        if (err) {
            callback(err);
            return;
        };
        callback();
    });
};