import { useState, useEffect } from 'react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({ 
  value, 
  onChange, 
  placeholder = '(00) 00000-0000', 
  className = '' 
}) => {
  const [inputValue, setInputValue] = useState('');

  // Atualizar o campo quando o valor externo mudar
  useEffect(() => {
    if (value) {
      setInputValue(formatarTelefone(value));
    }
  }, [value]);

  // Formatar telefone no padrão brasileiro
  const formatarTelefone = (telefone: string) => {
    // Remover caracteres não numéricos
    const apenasNumeros = telefone.replace(/\D/g, '');
    
    // Aplicar máscara conforme o tamanho
    if (apenasNumeros.length <= 2) {
      return apenasNumeros.length > 0 ? `(${apenasNumeros}` : apenasNumeros;
    } else if (apenasNumeros.length <= 6) {
      return `(${apenasNumeros.substring(0, 2)}) ${apenasNumeros.substring(2)}`;
    } else if (apenasNumeros.length <= 10) { // Telefone fixo
      return `(${apenasNumeros.substring(0, 2)}) ${apenasNumeros.substring(2, 6)}-${apenasNumeros.substring(6)}`;
    } else { // Celular
      return `(${apenasNumeros.substring(0, 2)}) ${apenasNumeros.substring(2, 7)}-${apenasNumeros.substring(7, 11)}`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Remove tudo que não for número para processar
    const apenasNumeros = input.replace(/\D/g, '');
    
    // Limitar a 11 dígitos (DDD + 9 dígitos do celular)
    if (apenasNumeros.length > 11) {
      return;
    }
    
    // Formatar e atualizar o estado
    const formatado = formatarTelefone(apenasNumeros);
    setInputValue(formatado);
    
    // Enviar apenas os números para o componente pai
    onChange(apenasNumeros);
  };

  return (
    <div className={`phone-input-container ${className}`}>
      <span className="country-code">+55</span>
      <input
        type="tel"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="form-input"
      />
    </div>
  );
};

export default PhoneInput; 