// app.js
import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Referências dos elementos
const produtosContainer = document.getElementById("produtosContainer");
const addProdutoBtn = document.getElementById("addProduto");
const pedidoForm = document.getElementById("pedidoForm");

// Se o formulário estiver na página
if (pedidoForm) {
  // Função para criar um grupo de campos de produto
  function criarCamposProduto() {
    const div = document.createElement("div");
    div.className = "flex space-x-2";

    div.innerHTML = `
      <input type="text" placeholder="Produto" class="produto flex-1 px-3 py-2 border rounded" required />
      <input type="number" placeholder="Quantidade" class="quantidade w-24 px-3 py-2 border rounded" required />
      <input type="number" placeholder="Valor Unitário" class="valor w-32 px-3 py-2 border rounded" required />
      <button type="button" class="remover bg-red-500 text-white px-2 rounded">X</button>
    `;

    // Adiciona funcionalidade ao botão de remover
    div.querySelector(".remover").addEventListener("click", () => {
      produtosContainer.removeChild(div);
    });

    produtosContainer.appendChild(div);
  }

  // Adiciona o primeiro produto por padrão
  criarCamposProduto();

  // Botão de adicionar mais produtos
  addProdutoBtn.addEventListener("click", () => {
    criarCamposProduto();
  });

  // Submissão do formulário
  pedidoForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const cliente = document.getElementById("cliente").value.trim();

    const produtos = Array.from(produtosContainer.children).map(div => {
      const produto = div.querySelector(".produto").value.trim();
      const quantidade = parseInt(div.querySelector(".quantidade").value);
      const valor = parseFloat(div.querySelector(".valor").value);
      return {
        nome: produto,
        quantidadeSolicitada: quantidade,
        valorUnitario: valor,
        produzido: 0,
        historicoProducao: []
      };
    });

    const pedido = {
      cliente,
      produtos,
      status: "Pendente",
      dataCriacao: serverTimestamp()
    };

    try {
      await addDoc(collection(db, "pedidos"), pedido);
      alert("Pedido salvo com sucesso!");
      pedidoForm.reset();
      produtosContainer.innerHTML = "";
      criarCamposProduto(); // adiciona novamente o primeiro produto vazio
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      alert("Erro ao salvar pedido.");
    }
  });
}
