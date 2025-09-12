# 🚀 Instruções de Deploy - Github Pages

## 📋 Checklist de Deploy

### 1. **Preparação do Repositório**

- [ ] Fork ou clone o repositório principal
- [ ] Navegue até a pasta `/github-poc/`
- [ ] Verifique se todos os arquivos estão presentes

### 2. **Configuração Github Pages**

1. Acesse **Settings** → **Pages** no seu repositório
2. Configure:
   - **Source:** Deploy from a branch
   - **Branch:** `main` ou `master`
   - **Folder:** `/github-poc` (root se mover arquivos para raiz)
3. **Save** e aguarde o deploy

### 3. **Verificação de Domínio**

- URL padrão: `https://[username].github.io/[repository]/github-poc/`
- URL customizada: `https://icaldana.github.io/github-poc/`
- Certifique-se que o HTTPS está ativo

### 4. **Teste Pós-Deploy**

- [ ] Acesse a URL e verifique se carrega
- [ ] Teste o botão de autenticação
- [ ] Verifique logs de console para erros
- [ ] Teste em dispositivo móvel real

---

## 🔧 Estrutura Final dos Arquivos

```
github-poc/
├── index.html              # Página principal
├── fido-iframe.html         # Handler WebAuthn
├── scripts/
│   └── fido-standalone.js   # Lógica principal
├── styles/
│   ├── main.css            # Estilos base
│   └── fido.css            # Estilos FIDO
├── README.md               # Documentação
├── DEPLOY.md               # Este arquivo
├── manifest.json           # PWA manifest
├── _config.yml             # Config Jekyll
├── CNAME                   # Domain config
└── .nojekyll              # Bypass Jekyll
```

---

## ⚠️ Problemas Comuns

### **"404 - Page not found"**

- Verifique se está acessando o path correto
- Confirme que o deploy foi concluído
- Aguarde até 10 minutos para propagação

### **"CORS Error"**

- Certifique-se que está acessando via HTTPS
- Não funciona em `localhost` ou `file://`
- Verifique configurações de CSP

### **"WebAuthn not supported"**

- Teste apenas em HTTPS
- Use navegador compatível (Chrome/Safari)
- Confirme biometria configurada no dispositivo

---

## 🔄 Updates e Manutenção

### **Para atualizar:**

1. Modifique arquivos localmente
2. Commit e push para a branch configurada
3. Github Pages rebuilda automaticamente
4. Teste após 2-5 minutos

### **Monitoring:**

- Verifique Actions tab para status de deploy
- Monitor de uptime: Github Status page
- Logs de erro: Browser DevTools

---

## 📱 Testes Recomendados

### **Desktop:**

- [ ] Chrome (Windows Hello / Touch ID)
- [ ] Safari (Touch ID / Face ID)
- [ ] Firefox (limitado)

### **Mobile:**

- [ ] iOS Safari (Touch ID / Face ID)
- [ ] Android Chrome (Biometria)
- [ ] Samsung Internet
- [ ] Edge Mobile

### **Cenários de teste:**

- [ ] Autenticação bem-sucedida
- [ ] Cancelamento pelo usuário
- [ ] Timeout de 60 segundos
- [ ] Dispositivo sem biometria
- [ ] Navegador não compatível

---

**✅ Deploy concluído com sucesso!**

**URL de acesso:** https://icaldana.github.io/github-poc/
