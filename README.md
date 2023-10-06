# SOCIAL CRUD

## Como correr:

* Clona este repositorio:
```bash
git clone 
```

* Navega al directorio del proyecto:
```bash
cd SocialCRUD
```

* Instala las dependencias:
```bash
npm install
```

* Crea una replica en tu máquina:
```bash
dfx start --background --clean
```

* Genera las declaraciones para que el frontend funcione:
```bash
dfx generate
```

* Despliega el canister a tu replica:
```bash
dfx deploy
```

De aquí verás algo como lo siguiente:
```
Deployed canisters.
URLs:
  Backend canister via Candid interface:
    social: http://127.0.0.1:8000/?canisterId=ryjl3-tyaaa-aaaaa-aaaba-cai&id=rrkah-fqaaa-aaaaa-aaaaq-cai
```

Puedes hacer click en el link que aparece en tu terminal e interactuar directamente con el canister utilizando la interfaz Candid.

O puedes crear un servidor de desarrollo para visualizar tu canister con tu frontend en modo desarrollo:
```bash
npm run dev
```