# Finance Tracker - Frontend

> **✅ Live**: https://finance-tracker.brxvn.xyz | **Stack**: React 18 + TypeScript | **Deploy**: GitHub Actions

## 🚀 **Quick Start**

### **Para Usuarios**
- **Visita**: https://finance-tracker.brxvn.xyz
- **Regístrate** y empieza a gestionar tus finanzas

### **Para Desarrolladores**
```bash
# Setup local
npm install
npm start  # http://localhost:3000

# Tests
npm test

# Build production
npm run build
```

## 🏗️ **Arquitectura**

### **Tech Stack**
- **React 18** + TypeScript
- **Context API** para state management  
- **JWT Authentication** con refresh tokens
- **CSS Modules** para styling
- **Create React App** optimizado

### **Estructura**
```
src/
├── components/auth/    # Login, Register forms
├── components/ui/      # Button, Input, Layout  
├── context/           # AuthContext (JWT state)
├── hooks/             # useAuth, useUserProfile
├── pages/             # LoginPage, DashboardPage
├── services/          # API calls (auth, users, accounts)
└── types/             # TypeScript interfaces
```

### **Deployment**
- **Auto**: Push a main con cambios en `/frontend/**`
- **Manual**: GitHub Actions → Deploy Frontend → Run workflow
- **Hosting**: AWS S3 + Cloudflare SSL
- **Domain**: finance-tracker.brxvn.xyz

---

**¿Necesitas más detalles?** Ver [README principal](../README.md) para documentación completa.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
