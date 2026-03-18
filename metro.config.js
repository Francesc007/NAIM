const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const emptyShim = path.resolve(__dirname, 'shims/empty.js');
const wsShim = path.resolve(__dirname, 'shims/ws.js');
const wsFactoryShim = path.resolve(__dirname, 'shims/websocket-factory.js');

// Evitar errores de WebSocket/ws de Supabase en React Native
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const emptyModules = ['net', 'tls', 'stream', 'events', 'bufferutil', 'utf-8-validate'];
  const isWsFactory =
    moduleName.includes('websocket-factory') ||
    moduleName === './lib/websocket-factory' ||
    moduleName.endsWith('/lib/websocket-factory');
  if (moduleName === 'ws') {
    return { type: 'sourceFile', filePath: wsShim };
  }
  if (isWsFactory) {
    return { type: 'sourceFile', filePath: wsFactoryShim };
  }
  if (emptyModules.includes(moduleName)) {
    return { type: 'sourceFile', filePath: emptyShim };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
