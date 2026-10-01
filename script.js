```javascript
document.addEventListener("DOMContentLoaded", () => {

    const botao = document.getElementById("startShare");
    const video = document.getElementById("screenPreview");
    const vazio = document.getElementById("emptyPreview");
    const mensagem = document.getElementById("message");

    console.log("JavaScript carregado!");

    if (!botao) {
        console.error("BOTÃO startShare NÃO ENCONTRADO!");
        return;
    }

    console.log("Botão encontrado!");

    botao.addEventListener("click", async () => {

        console.log("BOTÃO CLICADO!");

        mensagem.textContent = "Abrindo seleção de tela...";

        try {

            if (!navigator.mediaDevices) {
                throw new Error("mediaDevices não está disponível.");
            }

            if (!navigator.mediaDevices.getDisplayMedia) {
                throw new Error(
                    "getDisplayMedia não está disponível neste navegador."
                );
            }

            console.log("Abrindo getDisplayMedia...");

            const stream =
                await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                });

            console.log("Tela selecionada!", stream);

            video.srcObject = stream;
            video.style.display = "block";
            vazio.style.display = "none";

            mensagem.textContent =
                "🟢 Compartilhamento iniciado!";

            await video.play();

            const faixa =
                stream.getVideoTracks()[0];

            faixa.addEventListener("ended", () => {

                video.srcObject = null;

                video.style.display = "none";
                vazio.style.display = "flex";

                mensagem.textContent =
                    "Compartilhamento encerrado.";

            });

        } catch (erro) {

            console.error(
                "ERRO NO COMPARTILHAMENTO:",
                erro
            );

            mensagem.textContent =
```
