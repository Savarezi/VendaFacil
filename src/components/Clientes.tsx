import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { Client } from '../types';
import { Search, Plus, Edit2, Trash2, Users, Check, X, CreditCard } from 'lucide-react';

export default function Clientes() {
  const { clients, addClient, editClient, deleteClient } = useErp();

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modal toggle states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('');

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.document.includes(searchTerm) ||
    c.phone.includes(searchTerm)
  );

  const handleOpenModal = (c?: Client) => {
    if (c) {
      setEditingId(c.id);
      setName(c.name);
      setDocument(c.document);
      setPhone(c.phone);
      setAddress(c.address);
      setCreditLimit(c.creditLimit.toString());
    } else {
      setEditingId(null);
      setName('');
      setDocument('');
      setPhone('');
      setAddress('');
      setCreditLimit('2000');
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLimit = parseFloat(creditLimit) || 0;

    const record = {
      name,
      document,
      phone,
      address,
      creditLimit: parsedLimit
    };

    if (editingId) {
      editClient(editingId, record);
    } else {
      addClient(record);
    }
    setIsModalOpen(false);
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    deleteClient(id);
    setDeleteId(null);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Carteira de Clientes</h1>
          <p className="text-slate-500 text-sm mt-1">Cadastre novos compradores, gerencie limites de crediário e consulte dados de contato.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all text-sm font-medium flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} />
          Cadastrar Cliente
        </button>
      </div>

      {/* Control bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome, CPF/CNPJ ou telefone..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:bg-white transition-all text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs tracking-wider uppercase">
                <th className="px-6 py-3.5">Nome do Cliente</th>
                <th className="px-6 py-3.5">CPF / CNPJ</th>
                <th className="px-6 py-3.5">Telefone</th>
                <th className="px-6 py-3.5">Endereço Principal</th>
                <th className="px-6 py-3.5 text-right">Limite de Crédito</th>
                <th className="px-6 py-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {filteredClients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-all">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 text-sm">{c.name}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-500">{c.document}</td>
                  <td className="px-6 py-4 text-slate-600">{c.phone}</td>
                  <td className="px-6 py-4 text-slate-500 max-w-[220px] truncate" title={c.address}>
                    {c.address}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                    <div className="flex items-center justify-end gap-1 text-emerald-700">
                      <CreditCard size={12} />
                      <span>{formatCurrency(c.creditLimit)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleOpenModal(c)}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-all"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => setDeleteId(c.id)}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600 transition-all"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users size={36} strokeWidth={1} />
                      <span className="text-xs">Nenhum cliente correspondente encontrado.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Register Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden transition-all scale-100">
            <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b border-slate-101">
              <h2 className="font-bold text-slate-800 text-md">
                {editingId ? 'Editar Cadastro de Cliente' : 'Cadastrar Novo Cliente'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="font-semibold text-slate-600">Nome Completo / Razão Social</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Clara Ribeiro de Almeida"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">CPF ou CNPJ</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: 000.000.000-00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Telefone / WhatsApp</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: (11) 98765-4321"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="font-semibold text-slate-600">Endereço Principal</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Av. Consolação, 2500, Bloco C - Consolação, São Paulo/SP"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="font-semibold text-slate-600">Limite de Crediário Autorizado (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-slate-400">R$</span>
                    <input 
                      type="number" 
                      required
                      placeholder="0.00"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-all font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all font-medium flex items-center gap-1.5"
                >
                  <Check size={14} />
                  Salvar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-6 text-xs text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-slate-800 text-sm">Remover Cliente?</h3>
              <p className="text-slate-500">
                Deseja realmente remover este cliente de sua carteira? Esta ação desassociará seu cadastro do banco de dados.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-all font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all font-semibold"
              >
                Excluir Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
