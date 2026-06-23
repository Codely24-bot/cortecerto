import { useEffect, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import { apiFetch } from "../api.js";

const emptyForm = {
  nome: "",
  duracao: "60",
  preco: ""
};

function toCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

export default function Servicos() {
  const [servicos, setServicos] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadServicos() {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch("/servicos");
      setServicos(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServicos();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(servico) {
    setEditingId(servico.id);
    setForm({
      nome: servico.nome,
      duracao: String(servico.duracao),
      preco: String(servico.preco)
    });
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      nome: form.nome.trim(),
      duracao: Number(form.duracao),
      preco: Number(form.preco)
    };

    try {
      if (editingId) {
        await apiFetch(`/servicos/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        setSuccess("Servico atualizado com sucesso.");
      } else {
        await apiFetch("/servicos", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        setSuccess("Servico cadastrado com sucesso.");
      }

      resetForm();
      await loadServicos();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(servico) {
    const confirmed = window.confirm(`Deseja remover o servico ${servico.nome}?`);

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await apiFetch(`/servicos/${servico.id}`, {
        method: "DELETE"
      });
      setSuccess("Servico removido com sucesso.");
      if (editingId === servico.id) {
        resetForm();
      }
      await loadServicos();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <Topbar
        title="Catalogo de servicos"
        subtitle="Servicos"
        description="Defina os servicos da casa, duracao, ticket e posicionamento comercial em um painel mais elegante."
      />

      {error ? <p className="alert-error">{error}</p> : null}
      {success ? <p className="alert-success">{success}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="app-panel rounded-[2rem] p-6 md:p-8">
          <div>
            <h3 className="font-display text-xl text-white">Servicos cadastrados</h3>
            <p className="mt-2 text-sm text-soft">
              O faturamento estimado do dashboard usa os valores definidos aqui.
            </p>
          </div>

          {loading ? <p className="mt-6 text-sm text-soft">Carregando servicos...</p> : null}
          {!loading && !servicos.length ? (
            <p className="mt-6 text-sm text-soft">Nenhum servico cadastrado.</p>
          ) : null}

          {!loading && servicos.length ? (
            <div className="mt-6 overflow-x-auto">
              <table className="data-table text-sm">
                <thead>
                  <tr>
                    <th>Servico</th>
                    <th>Duracao</th>
                    <th>Preco</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {servicos.map((servico) => (
                    <tr key={servico.id}>
                      <td>{servico.nome}</td>
                      <td>{servico.duracao} min</td>
                      <td>{toCurrency(servico.preco)}</td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="btn-ghost px-3 py-2"
                            onClick={() => startEdit(servico)}
                            type="button"
                          >
                            Editar
                          </button>
                          <button
                            className="btn-danger px-3 py-2"
                            onClick={() => handleDelete(servico)}
                            type="button"
                          >
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        <div className="app-panel rounded-[2rem] p-6 md:p-8">
          <h3 className="font-display text-xl text-white">
            {editingId ? "Editar servico" : "Novo servico"}
          </h3>

          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="text-sm text-soft">
              Nome
              <input
                className="field-dark mt-2"
                placeholder="Ex.: Corte degrade"
                value={form.nome}
                onChange={(event) =>
                  setForm((current) => ({ ...current, nome: event.target.value }))
                }
              />
            </label>

            <label className="text-sm text-soft">
              Duracao em minutos
              <input
                className="field-dark mt-2"
                type="number"
                min="1"
                value={form.duracao}
                onChange={(event) =>
                  setForm((current) => ({ ...current, duracao: event.target.value }))
                }
              />
            </label>

            <label className="text-sm text-soft">
              Preco
              <input
                className="field-dark mt-2"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={form.preco}
                onChange={(event) =>
                  setForm((current) => ({ ...current, preco: event.target.value }))
                }
              />
            </label>

            <button className="btn-gold" disabled={saving}>
              {saving ? "Salvando..." : editingId ? "Salvar alteracoes" : "Cadastrar servico"}
            </button>

            {editingId ? (
              <button className="btn-ghost" onClick={resetForm} type="button">
                Cancelar edicao
              </button>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}
