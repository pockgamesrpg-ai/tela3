```javascript
alert("O JAVASCRIPT ESTÁ FUNCIONANDO!");

const botao = document.getElementById("startShare");

if (botao) {

    botao.addEventListener("click", function () {

        alert("O BOTÃO FOI CLICADO!");

    });

} else {

    alert("NÃO ENCONTREI O BOTÃO!");

}
```
