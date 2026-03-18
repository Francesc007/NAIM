/**
 * Shim para websocket-factory de Supabase/realtime en React Native.
 * Exporta el WebSocket nativo para evitar "constructor is not callable".
 */
module.exports = global.WebSocket;
