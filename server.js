import http from 'http';
import { readFile, writeFile } from './controller.js';
import * as formidable from 'formidable';
import uuid4 from "uuid4";
import moment from 'moment';
import fs from 'fs';

const model = {
    "nomeDeUsuario": "José",
    "email": "jose@gmail.com",
    "senha": "j0S3_123"
}

const regex = /^((?!\.)[\w-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/gim;

const PORT = 8080 || 3030

const server = http.createServer((req, res) => {
    const { url, method } = req;

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    const returnJSON = (type, codigo, retorno) => {
        res.writeHead(codigo, { "Content-Type": type })
        res.end(JSON.stringify({
            codigoHTTP: codigo,
            message: retorno
        }))
    }

    readFile((err, user) => {
        if (err) {
            returnJSON("application/json", 500, {
                message: "Não foi possivel ler o arquivo!"
            })
        }
        if (method === "GET" && url === '/usuarios') {
            returnJSON("application/json", 200, user)
        } else if (method === "POST" && url === "/usuarios") {
            let body = "";
            req.on("data", (chunk) => {
                body += chunk.toString();
            });
            req.on("end", () => {
                const novoUsuario = JSON.parse(body);
                if (!novoUsuario.hasOwnProperty("nomeDeUsuario") || !novoUsuario.hasOwnProperty("email") || !novoUsuario.hasOwnProperty("senha")) {
                    returnJSON("application/json", 401, {
                        message: "Não há dados o suficiente para registrar esse usuario, por favor, siga o modelo:",
                        modelo: model
                    })
                    return;
                } else {
                    if (!regex.test(novoUsuario.email)) {
                        returnJSON("application/json", 401, "O Email cadastrado não segue o modelo!");
                        return;
                    }
                    if (user.some(user => user.email == novoUsuario.email)) {
                        returnJSON("application/json", 403, "Este email já esta cadastrado em nossa base de dados!");
                        return;
                    }
                    novoUsuario.idUsuario = user.length + 1;
                    novoUsuario.id = uuid4();
                    fs.writeFile(`./img/user${novoUsuario.idUsuario}.png`, '', (err) => err ? console.log(err) : console.log('O arquivo foi criado'))
                    novoUsuario.nomeDeUsuario = novoUsuario.nomeDeUsuario.toLowerCase().replace(' ', "_").normalize('NFD').replace(/[\u0300-\u036f]/g, "");
                    novoUsuario.dataDeRegistro = moment().format('MMMM Do YYYY');
                    novoUsuario.perfil = {
                        nome: novoUsuario.nomeDeUsuario,
                        bio: "",
                        imagemDePerfil: `./img/user${novoUsuario.idUsuario}.png`
                    }
                    user.push(novoUsuario);
                    writeFile(user, '', () => {
                        if (err) {
                            returnJSON("application/json", 500, "Erro interno do servidor");
                            return;
                        }
                        returnJSON("application/json", 201, {
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
                    returnJSON("application/json", 401, {
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
                    returnJSON("application/json", 404, "Usuario não encontrado!")
                    return;
                }
                returnJSON("application/json", 200, {
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
                    returnJSON("application/json", 401, "Corpo da solicitação vazio!")
                }
                const indexUser = user.findIndex((user) => user.idUsuario == id);
                if (indexUser == -1) {
                    returnJSON("application/json", 404, "Não foi encontrado nenhuma usuario com este ID!");
                };
                user[indexUser].perfil = { ...user[indexUser].perfil, ...updatedUser };
                writeFile(user, user[indexUser], () => {
                    if (err) {
                        returnJSON("application/json", 500, "Erro interno do servidor");
                    };
                    returnJSON("application/json", 201, user[indexUser]);
                });
            })
        } else if (method === "GET" && url.startsWith("/perfil/imagem/")) {
            const id = url.split('/')[3]
            res.writeHead(200, { "Content-Type": "text/html" })
            res.end(`
              <h2>Atualize a imagem de perfil do usuario ${id}</h2>
              <form action="envioDeArquivo/${id}" enctype="multipart/form-data" method="post">
                <div>File: <input type="file" name="filetoupload"/></div>
                <input type="submit" value="Upload"/>
              </form>
            `);
        } else if (url.startsWith("/perfil/imagem/envioDeArquivo/")) {
            const id = url.split('/')[4]
            const form = new formidable.IncomingForm();
            form.parse(req, (err, field, files) => {
                const oldUrl = files.filetoupload[0].filepath
                const newUrl = `C:/Users/3°E/Documents/atividade-rede-social/img/user${id}.png`
                fs.rename(oldUrl, newUrl, (err) => {
                    if (err) {
                        throw err
                    }
                    res.write("Arquivo movido!")
                    res.end()
                })
                fs.renameSync(oldUrl, newUrl);
                res.end("Imagem alterada!!!")
            })
        } else if (method === "GET" && url.startsWith("/perfil/")) {
            const id = url.split('/')[2];
            const indexUser = user.findIndex((user) => user.idUsuario == id);
            if (indexUser.length === -1) {
                returnJSON("application/json", 404, "Usuario não encontrado")
            }
            returnJSON("application/json", 200, {
                nome: user[indexUser].nome,
                bio: user[indexUser].bio,
                imagemDoUsuario: user[indexUser].imagemDePerfil
            })
        } else {
            returnJSON("application/json", 404, "Rota não encontrada")
        }
    })
}).listen(PORT, () => {
    console.log(`Server aberto em http://localhost:${PORT}`)
})