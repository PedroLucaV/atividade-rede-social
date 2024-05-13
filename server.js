import http from 'http';
import { URLSearchParams } from 'url';
import { readFile, writeFile } from './controller.js';
import uuid4 from "uuid4";
import moment from 'moment';

const model = {
    "nomeDeUsuario": "José",
    "email": "jose@gmail.com",
    "senha": "j0S3_123"
}
function binaryToEnglishLetters1(str) {
    let splitStr = str.split(" "), result = [];

    for (let i = 0; i < splitStr.length; i++) {
        result.push(String.fromCharCode(parseInt(splitStr[i])));
    }
    return result.join("");
}
const momentoDaCriação = moment().format('MMMM Do YYYY, h:mm:ss a');

const regex = /^((?!\.)[\w-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/gim;

const PORT = 8080 || 3030

const server = http.createServer((req, res) => {
    const { url, method } = req;

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    const returnJSON = (codigo, retorno) => {
        res.writeHead(codigo, { "Content-Type": "application/json" })
        res.end(JSON.stringify({
            codigoHTTP: codigo,
            message: retorno
        }))
    }

    readFile((err, user) => {
        if (err) {
            returnJSON(500, {
                message: "Não foi possivel ler o arquivo!"
            })
        }
        if (method === "GET" && url === '/usuarios') {
            returnJSON(200, user)
        } else if (method === "POST" && url === "/usuarios") {
            let body = "";
            req.on("data", (chunk) => {
                body += chunk.toString();
            });
            req.on("end", () => {
                const novoUsuario = JSON.parse(body);
                if (!novoUsuario.hasOwnProperty("nomeDeUsuario") || !novoUsuario.hasOwnProperty("email") || !novoUsuario.hasOwnProperty("senha")) {
                    returnJSON(401, {
                        message: "Não há dados o suficiente para registrar esse usuario, por favor, siga o modelo:",
                        modelo: model
                    })
                    return;
                } else {
                    if (!regex.test(novoUsuario.email)) {
                        returnJSON(401, "O Email cadastrado não segue o modelo!");
                        return;
                    }
                    if (user.some(user => user.email == novoUsuario.email)) {
                        returnJSON(403, "Este email já esta cadastrado em nossa base de dados!");
                        return;
                    }
                    novoUsuario.idUsuario = user.length + 1;
                    novoUsuario.id = uuid4();
                    novoUsuario.nomeDeUsuario = novoUsuario.nomeDeUsuario.toLowerCase().replace(' ', "_").normalize('NFD').replace(/[\u0300-\u036f]/g, "");
                    novoUsuario.bio = '';
                    novoUsuario.nome = novoUsuario.nomeDeUsuario;
                    novoUsuario.dataDeRegistro = moment().format('MMMM Do YYYY');
                    novoUsuario.imagemDePerfil = '';
                    user.push(novoUsuario);
                    writeFile(user, '', () => {
                        if (err) {
                            returnJSON(500, "Erro interno do servidor");
                            return;
                        }
                        returnJSON(201, {
                            message: "Usuario criado com sucesso!",
                            user: novoUsuario
                        });

                    })
                }
            })
        } else if (method === "POST" && url === "/login") {
            let body = "";
            req.on("data", (chunk) => {
                body += chunk.toString();
            });
            req.on("end", () => {
                const login = JSON.parse(body)
                if (!login.hasOwnProperty("email") || !login.hasOwnProperty("senha")) {
                    returnJSON(401, {
                        message: "Não há dados o suficiente para realizar o login, por favor, insira email e senha neste modelo:",
                        modelo: {
                            "email": "carlos@gmail.com",
                            "senha": "c4rl0s123"
                        }
                    })
                    return;
                }
                const usuarioEncontrado = user.find(user => user.email == login.email && user.senha == login.senha)
                if (!usuarioEncontrado) {
                    returnJSON(404, "Usuario não encontrado!")
                    return;
                }
                returnJSON(200, {
                    message: "Login realizado!",
                    dados: usuarioEncontrado
                })
            })
        } else if (method === "PUT" && url.startsWith("/perfil/")) {
            const id = url.split('/')[2];
            let body = '';
            req.on('data', (chunk) => {
                body += chunk;
            });
            req.on('end', () => {
                const updatedUser = JSON.parse(body);
                if (!body) {
                    returnJSON(401, "Corpo da solicitação vazio!")
                }
                const indexUser = user.findIndex((user) => user.idUsuario == id);
                if (indexUser == -1) {
                    returnJSON(404, "Não foi encontrado nenhuma usuario com este ID!");
                };
                user[indexUser] = { ...user[indexUser], ...updatedUser, id };
                writeFile(user, user[indexUser], () => {
                    if (err) {
                        returnJSON(500, "Erro interno do servidor");
                    };
                    returnJSON(201, user[indexUser]);
                });
            })
        } else if (method === "GET" && url.startsWith("/perfil/")) {
            const id = url.split('/')[2];
            const indexUser = user.findIndex((user) => user.idUsuario == id);
            if (indexUser.length === -1) {
                returnJSON(404, "Usuario não encontrado")
            }
            returnJSON(200, {
                nome: user[indexUser].nome,
                bio: user[indexUser].bio,
                imagemDoUsuario: user[indexUser].imagemDePerfil
            })
        } else if (method === "POST" && url.startsWith("/perfil/imagem")) {
            const id = url.split('/')[2];
            let body = '';
            req.on('data', (chunk) => {
                body += chunk;
            });
            req.on('end', () => {
                
            })
        } else {
            returnJSON(404, "Rota não encontrada")
        }
    })
}).listen(PORT, () => {
    console.log(`Server aberto em http://localhost:${PORT}`)
})