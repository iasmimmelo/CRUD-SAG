const API = "/api/usuarios";

document

    .getElementById("cadastroForm")

    .addEventListener("submit", async function(e){

        e.preventDefault();

        const usuario = {

            nome:
            document.getElementById("nome").value,

            email:
            document.getElementById("email").value,

            senha:
            document.getElementById("senha").value

        };

        try {

            const resposta = await fetch(API, {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:

                    JSON.stringify(usuario)

            });

            if(resposta.ok){

                alert("Usuário cadastrado com sucesso!");
                window.location.href="login.html";

            }else{

                alert("Erro ao cadastrar usuário");

            }

        } catch(error){

            console.log(error);
            alert("Servidor indisponível");

        }

    });