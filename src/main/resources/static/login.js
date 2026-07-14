const API = "/api/usuarios/login";

document
.getElementById("loginForm")
.addEventListener("submit",
async function(e){

    e.preventDefault();

    const usuario = {

        email:
        document.getElementById("email").value,

        senha:
        document.getElementById("senha").value
    };

    const resposta =
    await fetch(API,{

        method:"POST",

        headers:{
            "Content-Type":
            "application/json"
        },

        body:
        JSON.stringify(usuario)
    });

    if(resposta.ok){

        const dados =
        await resposta.json();

        localStorage.setItem(
            "usuario",
            JSON.stringify(dados)
        );

        window.location.href =
            "index.html";

    }else{

        alert(
            "Email ou senha incorretos"
        );
    }
});