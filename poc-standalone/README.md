# 🚀 POC WebAuthn Standalone

## 📋 Visão Geral

POC **completamente independente** focada exclusivamente no processo de autenticação WebAuthn e obtenção do token via **auth-passkey-frontend + Factors**.

### ✅ Características:

- **Zero dependências** - Funciona standalone
- **GitHub Pages Ready** - Deploy direto no GitHub
- **Netlify/Vercel Compatible** - Deploy em qualquer static host
- **Mobile First** - Interface responsiva completa
- **WebAuthn Real** - Integração com serviços reais

### 🎯 Tecnologias:

- JavaScript Vanilla
- WebAuthn API
- MessageChannel
- auth-passkey-frontend service
- Factors integration

---

## ⚡ Quick Start

### **Opção 1: Local (Desenvolvimento)**

```bash
# Servir arquivos estáticos
python -m http.server 8000
# ou
npx serve . -p 8000

# Acessar
open http://localhost:8000
```

### **Opção 2: GitHub Pages**

1. Criar repositório no GitHub
2. Fazer upload dos arquivos desta pasta
3. Ativar GitHub Pages
4. Acessar: `https://username.github.io/repo-name/`

### **Opção 3: Netlify**

1. Arrastar pasta para [netlify.com/drop](https://netlify.com/drop)
2. Acessar URL gerada
3. Deploy automático!

### **Opção 4: Vercel**

```bash
npx vercel --prod
```

---

## 🧪 Como Testar

### 1. **Configurar:**

- User ID: `123456789` (pré-preenchido)
- Transaction ID: Inserir manualmente o valor desejado

### 2. **Executar:**

- Clicar "🚀 Iniciar Autenticação FIDO"
- **Confirmar biometria/PIN quando solicitado**
- Verificar transactionCode obtido do Factors

### 3. **Verificar logs:**

- Acompanhar cada etapa em tempo real
- Integração real com auth-passkey-frontend
- WebAuthn com challenge do Factors (sem simulação)

---

## 🏗️ Arquitetura

```
User → Input TX ID → auth-passkey-frontend → Factors → WebAuthn → transactionCode
```

### Fluxo Detalhado:

1. Usuário insere Transaction ID manualmente
2. Iframe chama auth-passkey-frontend para obter challenge real
3. Executa WebAuthn com challenge do Factors
4. Valida credencial via auth-passkey-frontend
5. Obtém transactionCode do Factors como security token
6. Exibe token para uso posterior

---

## 📁 Estrutura de Arquivos

```
poc-standalone/
├── index.html          # Página principal
├── iframe.html         # WebAuthn handler (sandbox)
├── style.css          # Estilos responsivos
├── script.js          # Lógica principal
└── README.md          # Esta documentação
```

### Detalhes dos Arquivos:

#### **index.html**

- Interface principal da POC
- Configuração de inputs (User ID, Transaction ID)
- Iframe oculto para WebAuthn
- Exibição de logs e resultados

#### **iframe.html**

- Handler isolado para WebAuthn
- Comunicação via MessageChannel
- Integração real com auth-passkey-frontend
- Logs internos do processo

#### **style.css**

- Design mobile-first responsivo
- Tema com gradientes e glass effect
- Componentes touch-friendly
- Animações e feedback visual

#### **script.js**

- Classe `PasskeyStandaloneIntegration`
- Gerenciamento de MessageChannel
- Logger integrado
- Manipulação de UI e estados

---

## 🌐 Deploy Options

### **GitHub Pages**

```bash
# 1. Criar repo no GitHub
# 2. Upload files
# 3. Settings > Pages > Deploy from branch
# 4. Acessar: https://username.github.io/repo-name/
```

### **Netlify**

```bash
# Drag & Drop na interface
# ou via Netlify CLI
netlify deploy --prod --dir=.
```

### **Vercel**

```bash
vercel --prod
```

### **Firebase Hosting**

```bash
firebase init hosting
firebase deploy
```

---

## ⚠️ Considerações CORS

### **Possíveis Problemas:**

- auth-passkey-frontend pode ter CORS restritivo
- Algumas hospedagens podem ser bloqueadas

### **Soluções:**

1. **Netlify Functions** (Proxy)
2. **Vercel API Routes** (Proxy)
3. **Cloudflare Workers** (Proxy)

### **Exemplo Netlify Function:**

```javascript
// netlify/functions/auth-proxy.js
exports.handler = async (event, context) => {
  const response = await fetch('https://auth-passkey-frontend.sandbox.melioffice.com' + event.path, {
    method: event.httpMethod,
    headers: event.headers,
    body: event.body,
  });

  return {
    statusCode: response.status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: await response.text(),
  };
};
```

---

## 🔧 Customização

### **Alterar Endpoints:**

Editar em `iframe.html`:

```javascript
const AUTH_PASSKEY_CONFIG = {
  baseUrl: 'https://auth-passkey-frontend.sandbox.melioffice.com',
  timeout: 60000,
};
```

### **Alterar Estilos:**

Modificar `style.css` para personalizar:

- Cores e tema
- Layout responsivo
- Animações
- Componentes

### **Adicionar Logs:**

Usar a classe `FidoLogger`:

```javascript
this.logger.log('Mensagem', 'info'); // info, success, error, warning
```

---

## 🚀 Próximos Passos

1. **Testar CORS** - Verificar se auth-passkey-frontend aceita seu domínio
2. **Deploy** - Escolher plataforma de hospedagem
3. **Customizar** - Adaptar para suas necessidades
4. **Monitorar** - Acompanhar logs e erros
5. **Integrar** - Usar como base para implementação final

---

## 📞 Suporte

### **Debug:**

- Abrir DevTools (F12)
- Verificar Console para logs detalhados
- Verificar Network tab para chamadas HTTP
- Verificar CORS errors

### **Problemas Comuns:**

1. **CORS Error**: Usar proxy ou whitelist do domínio
2. **WebAuthn Error**: Verificar se dispositivo suporta
3. **Timeout**: Verificar conexão com auth-passkey-frontend
4. **Transaction ID**: Verificar se ID é válido

---

**Versão**: 2.0.0 - Standalone  
**Última Atualização**: 12/09/2025  
**Compatibilidade**: Todos navegadores modernos com WebAuthn
