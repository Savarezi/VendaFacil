import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { Supplier } from '../types';
import { Search, Plus, Edit2, Trash2, Truck, Check, X, Mail, Phone, UserCheck } from 'lucide-react';

export default function Fornecedores() {
  const { suppliers, addSupplier, editSupplier, deleteSupplier } = useErp();

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modal toggle states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form inputs
  const [companyName, setCompanyName] = useState('');
  const [document, setDocument] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const filteredSuppliers = suppliers.filter(s => 
    s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.document.includes(searchTerm) ||
    s.contactName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (s?: Supplier) => {
    if (s) {
      setEditingId(s.id);
      setCompanyName(s.companyName);
      setDocument(s.document);
      setContactName(s.contactName);
      setPhone(s.phone);
      setEmail(s.email);
    } else {
      setEditingId(null);
      setCompanyName('');
      setDocument('');
      setContactName('');
      setPhone('');
      setEmail('');
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const record = {
      companyName,
      document,
      contactName,
      phone,
      email
    };

    if (editingId) {
      editSupplier(editingId, record);
    } else {
      addSupplier(record);
    }
    setIsModalOpen(false);
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    deleteSupplier(id);
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Diretório de Fornecedores</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie canais de atacado, marcas parceiras, dados e contratos de suprimentos.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all text-sm font-medium flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} />
          Cadastrar Fornecedor
        </button>
      </div>

      {/* Control bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por razão social, CNPJ ou contato..."
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
                <th className="px-6 py-3.5">Razão Social</th>
                <th className="px-6 py-3.5">CNPJ</th>
                <th className="px-6 py-3.5">Contato Comercial</th>
                <th className="px-6 py-3.5">Telefone</th>
                <th className="px-6 py-3.5">E-mail de Suporte</th>
                <th className="px-6 py-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {filteredSuppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-all">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                      <Truck size={14} className="text-slate-400" />
                      <span>{s.companyName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-500">{s.document}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <UserCheck size={12} className="text-indigo-500" />
                      <span>{s.contactName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} className="text-slate-400" />
                      <span>{s.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">
                    <div className="flex items-center gap-1.5">
                      <Mail size={12} className="text-slate-400" />
                      <span>{s.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleOpenModal(s)}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-all"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => setDeleteId(s.id)}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600 transition-all"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Truck size={36} strokeWidth={1} />
                      <span className="text-xs">Nenhum fornecedor correspondente encontrado.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Register Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden transition-all scale-100">
            <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-md">
                {editingId ? 'Editar Dados do Fornecedor' : 'Cadastrar Novo Fornecedor'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="font-semibold text-slate-600">Razão Social (Nome Comercial)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Samsung Electronics Brasil S/A"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">CNPJ</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: 00.322.122/0001-99"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Nome de Contato Comercial</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Fernando Souza"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Telefone Fixo / Celular</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: (11) 4004-1234"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">E-mail Comercial de Contato</label>
                  <input 
                    type="email" 
                    required
                    placeholder="fernando@empresa.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
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
              <h3 className="font-bold text-slate-800 text-sm">Remover Fornecedor?</h3>
              <p className="text-slate-500">
                Deseja realmente remover este fornecedor? Esta ação desassociará permanentemente seu cadastro e dados vinculados.
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
                Excluir Fornecedor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
