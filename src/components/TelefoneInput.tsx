import React, { useState, useEffect } from 'react';

interface TelefoneInputProps {
  value: string;
  onChange: (value: string) => void;
  name: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

const TelefoneInput: React.FC<TelefoneInputProps> = ({
  value,
  onChange,
  name,
  placeholder = '(99) 99999-9999',
  className = 'form-input',
  required = false
}) => {
  const [erro, setErro] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState(value || '');

  useEffect(() => {
    // Atualizar o valor quando a prop value mudar
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  const formatarTelefone = (telefone: string): string => {
    // Remover todos os caracteres não numéricos
    const apenasNumeros = telefone.replace(/\D/g, '');
    
    // Verificar se é um celular (11 dígitos) ou telefone fixo (10 dígitos)
    if (apenasNumeros.length <= 10) {
      // Formato: (99) 9999-9999
      return apenasNumeros.replace(/(\d{0,2})(\d{0,4})(\d{0,4})/, (_, ddd, parte1, parte2) => {
        let resultado = '';
        if (ddd) resultado += `(${ddd}`;
        if (ddd && (parte1 || parte2)) resultado += ') ';
        if (parte1) resultado += parte1;
        if (parte1 && parte2) resultado += '-';
        if (parte2) resultado += parte2;
        return resultado;
      });
    } else {
      // Formato: (99) 99999-9999
      return apenasNumeros.replace(/(\d{0,2})(\d{0,5})(\d{0,4})/, (_, ddd, parte1, parte2) => {
        let resultado = '';
        if (ddd) resultado += `(${ddd}`;
        if (ddd && (parte1 || parte2)) resultado += ') ';
        if (parte1) resultado += parte1;
        if (parte1 && parte2) resultado += '-';
        if (parte2) resultado += parte2;
        return resultado;
      });
    }
  };

  const validarTelefone = (telefone: string): boolean => {
    const apenasNumeros = telefone.replace(/\D/g, '');
    // Telefone fixo (10 dígitos) ou celular (11 dígitos)
    return apenasNumeros.length === 10 || apenasNumeros.length === 11;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novoValor = e.target.value;
    const valorFormatado = formatarTelefone(novoValor);
    
    setInputValue(valorFormatado);
    
    // Validar apenas se o usuário digitou algo
    if (valorFormatado.length > 0) {
      const valido = validarTelefone(valorFormatado);
      setErro(valido ? null : 'Telefone inválido. Use (99) 9999-9999 ou (99) 99999-9999');
    } else {
      setErro(null);
    }
    
    // Passar o valor para o componente pai
    onChange(valorFormatado);
  };

  const handleBlur = () => {
    // Validar ao perder o foco
    if (inputValue.length > 0) {
      const valido = validarTelefone(inputValue);
      setErro(valido ? null : 'Telefone inválido. Use (99) 9999-9999 ou (99) 99999-9999');
    }
  };

  return (
    <div className="telefone-input-container">
      <input
        type="tel"
        name={name}
        className={`${className} ${erro ? 'input-error' : ''}`}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
      />
      {erro && <div className="error-message">{erro}</div>}
    </div>
  );
};

export default TelefoneInput; 