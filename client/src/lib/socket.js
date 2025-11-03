import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://subcallosal-overhuman-wilma.ngrok-free.dev';

export const socket = io(SOCKET_URL, { transports: ['websocket'] });