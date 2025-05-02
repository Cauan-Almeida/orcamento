import { useState, useEffect } from 'react';
import { Empresa } from '../types';
import PhoneInput from './PhoneInput';

interface CompanyConfigProps {
  empresa: Empresa;
  onSubmit: (empresa: Empresa) => void;
  onCancel: () => void;
}

const CompanyConfig: React.FC<CompanyConfigProps> = ({ 
  empresa, 
  onSubmit, 
  onCancel 
}) => {
  const [nome, setNome] = useState(empresa.nome || '');
  const [cnpj, setCnpj] = useState(empresa.cnpj || '');
  const [telefone, setTelefone] = useState(empresa.telefone || '');
  const [email, setEmail] = useState(empresa.email || '');
  const [endereco, setEndereco] = useState(empresa.endereco || '');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    // Atualizar os campos quando a prop empresa mudar
    setNome(empresa.nome || '');
    setCnpj(empresa.cnpj || '');
    setTelefone(empresa.telefone || '');
    setEmail(empresa.email || '');
    setEndereco(empresa.endereco || '');
  }, [empresa]);

  const formatarCNPJ = (valor: string): string => {
    // Remover caracteres não numéricos
    const apenasNumeros = valor.replace(/\D/g, '');
    
    // Aplicar máscara de CNPJ: XX.XXX.XXX/XXXX-XX
    return apenasNumeros
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18); // Limitar ao tamanho máximo do CNPJ formatado
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setCnpj(formatarCNPJ(valor));
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!nome.trim()) {
      newErrors.nome = 'Nome da empresa é obrigatório';
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
        cnpj,
        telefone,
        email: email.trim(),
        endereco: endereco.trim()
      });
    }
  };

  const handlePhoneChange = (value: string) => {
    setTelefone(value);
  };

  return (
    <div className="card">
      <div className="company-config-header">
        <h2>Configurações da Empresa</h2>
        <p className="help-text">Estas informações serão exibidas nos orçamentos gerados.</p>
      </div>

      <form onSubmit={handleSubmit} className="company-form">
        <div className="form-group">
          <label htmlFor="nome">Nome da Empresa *</label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={`form-input ${errors.nome ? 'input-error' : ''}`}
            placeholder="Nome da sua empresa"
          />
          {errors.nome && <div className="error-message">{errors.nome}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="cnpj">CNPJ</label>
          <input
            id="cnpj"
            type="text"
            value={cnpj}
            onChange={handleCNPJChange}
            className="form-input"
            placeholder="00.000.000/0000-00"
            maxLength={18}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="telefone">Telefone</label>
          <PhoneInput
            value={telefone}
            onChange={handlePhoneChange}
            placeholder="(00) 0000-0000"
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
            placeholder="contato@suaempresa.com"
          />
          {errors.email && <div className="error-message">{errors.email}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="endereco">Endereço</label>
          <input
            id="endereco"
            type="text"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            className="form-input"
            placeholder="Rua, número, bairro, cidade - UF"
          />
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Salvar Dados da Empresa
          </button>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyConfig; 