import { useState, useEffect } from 'react';
import { Cliente } from '../types';
import PhoneInput from './PhoneInput';

interface ClientFormProps {
  cliente: Cliente;
  onSubmit: (cliente: Cliente) => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ cliente, onSubmit }) => {
  const [nome, setNome] = useState(cliente.nome || '');
  const [telefone, setTelefone] = useState(cliente.telefone || '');
  const [email, setEmail] = useState(cliente.email || '');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    // Atualizar os campos quando o cliente prop mudar
    setNome(cliente.nome || '');
    setTelefone(cliente.telefone || '');
    setEmail(cliente.email || '');
  }, [cliente]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!nome.trim()) {
      newErrors.nome = 'Nome do cliente é obrigatório';
    }
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        nome: nome.trim(),
        telefone,
        email: email.trim()
      });
    }
  };

  const handlePhoneChange = (value: string) => {
    setTelefone(value);
  };

  return (
    <form onSubmit={handleSubmit} className="client-form card">
      <div className="form-group">
        <label htmlFor="nome">Nome *</label>
        <input
          id="nome"
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={`form-input ${errors.nome ? 'input-error' : ''}`}
          placeholder="Digite o nome do cliente"
        />
        {errors.nome && <div className="error-message">{errors.nome}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="telefone">Telefone</label>
        <PhoneInput
          value={telefone}
          onChange={handlePhoneChange}
          placeholder="(00) 00000-0000"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`form-input ${errors.email ? 'input-error' : ''}`}
          placeholder="cliente@example.com"
        />
        {errors.email && <div className="error-message">{errors.email}</div>}
      </div>
      
      <button type="submit" className="btn btn-primary">
        Salvar Dados do Cliente
      </button>
    </form>
  );
};

export default ClientForm; 