document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("email").value;
            const senha = document.getElementById("senha").value;

            try {
                const resposta = await fetch(`/api/usuarios/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email, senha })
                });

                if (!resposta.ok) {
                    alert("E-mail ou senha inválidos!");
                    return;
                }

                const usuario = await resposta.json();
                localStorage.setItem("usuario", JSON.stringify(usuario));

                window.location.href = "index.html";

            } catch (error) {
                console.error("Erro no login:", error);
                alert("Erro ao conectar com o servidor.");
            }
        });
    }
});