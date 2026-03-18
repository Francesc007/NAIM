/**
 * Shim para 'ws' en React Native: usa el WebSocket nativo.
 * Evita el error "constructor is not callable" de Supabase/realtime.
 */
module.exports = global.WebSocket;
