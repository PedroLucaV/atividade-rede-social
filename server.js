import http from 'http';
import { URLSearchParams } from 'url';
import { readFile, writeFile } from './controller.js';

const PORT = 8080 || 3030

const server = http.createServer((req, res) => {
    const { url, method } = req;

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    const returnJSON = (codigo, retorno) => {
        res.writeHead(codigo, {"Content-Type": "application/json"})
        res.end(JSON.stringify({
            codigoHTTP: codigo,
            message: retorno
        }))
    }

    readFile((err, user) => {
        if(err){
            returnJSON(500, {
                message: "Não foi possivel ler o arquivo!"
            })
        }
        if(method === "GET" && url === '/usuarios'){
            returnJSON(200, user)
        }
    })
}).listen(PORT, () => {
    console.log(`Server aberto em http://localhost:${PORT}`)
})