export interface VPSNode {
  id: string;
  name: string;
  ip: string;
  port: number;
  status: 'online' | 'offline' | 'warning';
  location: string;
  os: string;
  stats: {
    cpu: number;
    ram: number;
    ramTotal: number;
    ramUsed: number;
    disk: number;
    diskTotal: number;
    diskUsed: number;
    diskRead: number;
    diskWrite: number;
    uptime: number;
    networkIn: number;
    networkOut: number;
    networkInSpeed: number;
    networkOutSpeed: number;
    processes: number;
  };
  lastSeen: number;
  x: number;
  y: number;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
}
