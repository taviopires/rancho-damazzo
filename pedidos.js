
import { db } from './firebase-config.js';
import {
  collection, onSnapshot, query, orderBy,
  doc, updateDoc, getDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const listaPedidos = document.getElementById("listaPedidos");
const pedidosRef = collection(db, "pedidos");
const q = query(pedidosRef, orderBy("dataCriacao", "desc"));

onSnapshot(q, (snapshot) => {
  listaPedidos.innerHTML = "";
  snapshot.forEach((docSnap) => {
    const pedido = docSnap.data();
    const pedidoId = docSnap.id;
    const div = document.createElement("div");
    div.className = "card p-4 rounded shadow";

    const bloqueado = pedido.status === "Entregue";
    const podeExcluir = pedido.dataEntrega && (new Date() - new Date(pedido.dataEntrega)) >= 43200000;

    let produtosHTML = pedido.produtos.map((prod, index) => {
      const historicoHTML = prod.historicoProducao.map(entry => {
        const data = new Date(entry.data).toLocaleString("pt-BR");
        return `<li>${entry.nome} produziu ${entry.quantidade} em ${data}</li>`;
      }).join("");

      return `
        <li class="mb-4 border-b pb-2">
          <p><strong>${prod.nome}</strong> — ${prod.produzido}/${prod.quantidadeSolicitada} produzidos</p>
          <p>R$ ${prod.valorUnitario.toFixed(2)} cada</p>
          ${!bloqueado ? `
          <div class="flex items-center space-x-2 mt-2">
            <input type="text" placeholder="Quem produziu" class="input-produtor border px-2 py-1 rounded" data-pedido="${pedidoId}" data-index="${index}">
            <input type="number" placeholder="Qtd" class="input-quantidade border px-2 py-1 w-20 rounded" data-pedido="${pedidoId}" data-index="${index}">
            <button class="btn-registrar btn px-3 py-1 rounded" data-pedido="${pedidoId}" data-index="${index}">Registrar</button>
          </div>` : ""}
          ${prod.historicoProducao.length > 0 ? `
          <div class="mt-2 text-sm text-yellow-100">
            <p class="font-semibold mt-2">Histórico:</p>
            <ul class="list-disc ml-6">${historicoHTML}</ul>
          </div>` : ""}
        </li>
      `;
    }).join("");

    div.innerHTML = `
      <h2 class="text-lg font-semibold">Cliente: ${pedido.cliente}</h2>
      <p>Status: <span class="font-bold">${pedido.status}</span></p>
      <div class="mt-2">
        <ul class="list-disc ml-6" id="produtos-${pedidoId}">${produtosHTML}</ul>
      </div>
      <div class="mt-4 space-x-2">
        ${!bloqueado ? `
          <button class="btn-editar btn px-4 py-1 rounded" data-pedido="${pedidoId}">✏️ Editar</button>
          <button class="btn-salvar hidden btn px-4 py-1 rounded" data-pedido="${pedidoId}">💾 Salvar</button>
          <button class="btn-adicionar hidden btn px-3 py-1 rounded" data-pedido="${pedidoId}">➕ Produto</button>
        ` : ""}
        ${pedido.status === "Pronto para entrega" ? `
          <button class="btn-entregar btn px-4 py-1 rounded" data-pedido="${pedidoId}">✅ Entregar</button>
        ` : ""}
        ${podeExcluir ? `
          <button class="btn-excluir btn px-4 py-1 rounded bg-red-600 hover:bg-red-700" data-pedido="${pedidoId}">🗑️ Excluir</button>
        ` : ""}
      </div>
    `;
    listaPedidos.appendChild(div);
  });
});

document.addEventListener("click", async (e) => {
  const el = e.target;

  if (el.classList.contains("btn-registrar")) {
    const pedidoId = el.dataset.pedido;
    const index = parseInt(el.dataset.index);
    const nomeInput = document.querySelector(`.input-produtor[data-pedido="${pedidoId}"][data-index="${index}"]`);
    const qtdInput = document.querySelector(`.input-quantidade[data-pedido="${pedidoId}"][data-index="${index}"]`);
    const nome = nomeInput.value.trim();
    const qtd = parseInt(qtdInput.value);
    if (!nome || isNaN(qtd) || qtd <= 0) return alert("Preencha corretamente.");
    const pedidoRef = doc(db, "pedidos", pedidoId);
    const pedidoSnap = await getDoc(pedidoRef);
    const pedido = pedidoSnap.data();
    const produto = pedido.produtos[index];
    produto.produzido += qtd;
    produto.historicoProducao.push({ nome, quantidade: qtd, data: new Date().toISOString() });
    const todosConcluidos = pedido.produtos.every(p => p.produzido >= p.quantidadeSolicitada);
    pedido.status = todosConcluidos ? "Pronto para entrega" : "Em produção";
    await updateDoc(pedidoRef, { produtos: pedido.produtos, status: pedido.status });
    nomeInput.value = ""; qtdInput.value = "";
    alert("Produção registrada com sucesso!");
  }

  if (el.classList.contains("btn-editar")) {
    const pedidoId = el.dataset.pedido;
    const lista = document.getElementById(`produtos-${pedidoId}`);
    const lis = lista.querySelectorAll("li");
    lis.forEach((li, index) => {
      const prodNome = li.querySelector("strong")?.textContent.split(" —")[0];
      const qtdTotal = li.innerHTML.match(/(\d+)\/(\d+)/)?.[2] ?? "";
      const valor = li.innerHTML.match(/R\$ (\d+(\.\d+)?)/)?.[1] ?? "";
      li.innerHTML = `
        <input type="text" class="edit-nome border px-2 py-1 rounded" value="${prodNome}" data-index="${index}" data-pedido="${pedidoId}" />
        <input type="number" class="edit-qtd border px-2 py-1 rounded w-20" value="${qtdTotal}" data-index="${index}" data-pedido="${pedidoId}" />
        <input type="number" class="edit-valor border px-2 py-1 rounded w-28" value="${valor}" data-index="${index}" data-pedido="${pedidoId}" />
        <button class="remover-prod bg-red-600 text-white px-2 py-1 rounded" data-index="${index}" data-pedido="${pedidoId}">🗑️</button>
      `;
    });
    el.classList.add("hidden");
    document.querySelector(`.btn-salvar[data-pedido="${pedidoId}"]`).classList.remove("hidden");
    document.querySelector(`.btn-adicionar[data-pedido="${pedidoId}"]`).classList.remove("hidden");
  }

  if (el.classList.contains("btn-adicionar")) {
    const pedidoId = el.dataset.pedido;
    const lista = document.getElementById(`produtos-${pedidoId}`);
    const index = lista.querySelectorAll("li").length;
    const li = document.createElement("li");
    li.className = "mb-4 border-b pb-2";
    li.innerHTML = `
      <input type="text" class="edit-nome border px-2 py-1 rounded" placeholder="Produto" data-index="${index}" data-pedido="${pedidoId}" />
      <input type="number" class="edit-qtd border px-2 py-1 rounded w-20" placeholder="Qtd" data-index="${index}" data-pedido="${pedidoId}" />
      <input type="number" class="edit-valor border px-2 py-1 rounded w-28" placeholder="Valor" data-index="${index}" data-pedido="${pedidoId}" />
      <button class="remover-prod bg-red-600 text-white px-2 py-1 rounded" data-index="${index}" data-pedido="${pedidoId}">🗑️</button>
    `;
    lista.appendChild(li);
  }

  if (el.classList.contains("remover-prod")) {
    const li = el.closest("li");
    if (li) li.remove();
  }

  if (el.classList.contains("btn-salvar")) {
    const pedidoId = el.dataset.pedido;
    const inputs = document.querySelectorAll(`#produtos-${pedidoId} li`);
    const produtos = [];
    inputs.forEach((li) => {
      const nome = li.querySelector(".edit-nome")?.value.trim();
      const quantidade = parseInt(li.querySelector(".edit-qtd")?.value);
      const valorUnitario = parseFloat(li.querySelector(".edit-valor")?.value);
      if (!nome || isNaN(quantidade) || isNaN(valorUnitario)) return;
      produtos.push({
        nome,
        quantidadeSolicitada: quantidade,
        valorUnitario,
        produzido: 0,
        historicoProducao: []
      });
    });
    if (produtos.length === 0) return alert("Pedido inválido.");
    await updateDoc(doc(db, "pedidos", pedidoId), { produtos, status: "Pendente" });
    alert("Pedido atualizado com sucesso!");
    location.reload();
  }

  if (el.classList.contains("btn-entregar")) {
    const pedidoId = el.dataset.pedido;
    await updateDoc(doc(db, "pedidos", pedidoId), {
      status: "Entregue",
      dataEntrega: new Date().toISOString()
    });
    alert("Pedido marcado como entregue!");
  }

  if (el.classList.contains("btn-excluir")) {
    const pedidoId = el.dataset.pedido;
    if (confirm("Deseja excluir este pedido permanentemente?")) {
      await deleteDoc(doc(db, "pedidos", pedidoId));
      alert("Pedido excluído.");
    }
  }
});
