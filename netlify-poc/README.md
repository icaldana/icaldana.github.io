# 🔐 POC FIDO Standalone - Netlify Functions

## 📋 Visão Geral

POC de integração FIDO Standalone com WebAuthn real hospedada no **Netlify com Functions serverless** para resolver definitivamente o problema de CORS e testar autenticação biométrica em dispositivos móveis reais.

### ✨ **Características desta versão:**

- 🌐 **Netlify Functions** para proxy das APIs do Mercado Pago
- 🛡️ **CORS resolvido** definitivamente via serverless
- 📱 **Otimizado para mobile** com interface responsiva
- 🔐 **WebAuthn real** - sem simulação de biometria
- ⚡ **Deploy em 1 clique** - configuração automática
- 🚀 **Edge deployment** - performance global

---

## 🚀 Deploy Rápido (5 minutos)

1. **Criar conta no Netlify** (gratuito): https://netlify.com
2. **Conectar repositório**:
   - New site from Git → GitHub
   - Selecionar repositório
   - Pasta: `/netlify-poc`
3. **Deploy automático**: Netlify detecta `netlify.toml` e configura tudo

---

## 🌐 URLs de Acesso

Após o deploy, você terá:

```
🌍 Site Principal: https://[random-name].netlify.app/
📡 Functions:
  - /.netlify/functions/auth-create
  - /.netlify/functions/auth-validate/:id/validation
  - /.netlify/functions/auth-close/:id/close
```

### **Endpoints Utilizados via Netlify Functions:**

- `POST /.netlify/functions/auth-create` → Criar transação
- `POST /.netlify/functions/auth-validate/{id}/validation` → Validar WebAuthn
- `POST /.netlify/functions/auth-close/{id}/close` → Obter security token

---

## 🔧 Estrutura dos Arquivos

```
netlify-poc/
├── netlify/
│   └── functions/
│       ├── auth-create.js          # Proxy para criar transação
│       ├── auth-validate.js        # Proxy para validar WebAuthn
│       └── auth-close.js           # Proxy para obter token
├── scripts/
│   └── fido-standalone.js          # JavaScript adaptado para Netlify
├── styles/
│   ├── main.css                    # Estilos base + banner Netlify
│   └── fido.css                    # Estilos FIDO responsivos
├── index.html                      # Interface principal
├── fido-iframe.html                # Handler WebAuthn isolado
├── netlify.toml                    # Configuração Netlify
├── README.md                       # Esta documentação
└── DEPLOY.md                       # Instruções de deploy
```

## 🔄 Desenvolvimento Local

### **Pré-requisitos:**

```bash
npm install -g netlify-cli
```

### **Executar localmente:**

```bash
cd netlify-poc/
netlify dev
```

### **URLs locais:**

- Site: http://localhost:8888
- Functions: http://localhost:8888/.netlify/functions/auth-create

---

## 📊 Logs e Monitoramento

### **Via Dashboard Netlify:**

1. Acessar https://app.netlify.com
2. Selecionar seu site
3. Functions → View logs em tempo real

### **Logs das Functions:**

- **auth-create**: Criação de transações
- **auth-validate**: Validação WebAuthn
- **auth-close**: Obtenção de security tokens

### **Debugging:**

- Console do navegador para frontend
- Netlify Functions logs para backend
- Network tab para requisições HTTP

---

**Última atualização:** ${new Date().toLocaleDateString('pt-BR')}  
**Versão:** 1.0.0 - Netlify Functions  
**Ambiente:** Sandbox + HTTPS + Serverless
