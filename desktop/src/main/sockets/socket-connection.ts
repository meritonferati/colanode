import { WebSocket } from 'ws';
import { Account } from '@/types/accounts';
import { Server } from '@/types/servers';
import { buildSynapseUrl } from '@/lib/servers';
import { BackoffCalculator } from '@/lib/backoff-calculator';
import { MessageInput } from '@/operations/messages';
import { mediator } from '@/main/mediator';

export class SocketConnection {
  private readonly server: Server;
  private readonly account: Account;
  private socket: WebSocket | null;
  private backoffCalculator: BackoffCalculator;
  private closingCount: number;

  constructor(server: Server, account: Account) {
    this.server = server;
    this.account = account;
    this.socket = null;
    this.backoffCalculator = new BackoffCalculator();
    this.closingCount = 0;
  }

  public init(): void {
    if (this.isConnected()) {
      return;
    }

    if (!this.backoffCalculator.canRetry()) {
      return;
    }

    this.socket = new WebSocket(
      buildSynapseUrl(this.server, this.account.deviceId),
    );

    this.socket.onmessage = async (event) => {
      let data: string;

      if (typeof event.data === 'string') {
        data = event.data;
      } else if (event.data instanceof ArrayBuffer) {
        data = new TextDecoder().decode(event.data);
      } else {
        console.error('Unsupported message data type:', typeof event.data);
        return;
      }

      const message: MessageInput = JSON.parse(data);
      await mediator.executeMessage(message);
    };

    this.socket.onopen = () => {
      this.backoffCalculator.reset();
    };

    this.socket.onerror = () => {
      this.backoffCalculator.increaseError();
    };
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  public close(): void {
    if (this.socket) {
      this.socket.close();
    }
  }

  public checkConnection(): void {
    if (this.account.status === 'logout') {
      if (this.isConnected()) {
        this.close();
      }

      return;
    }

    if (this.isConnected()) {
      return;
    }

    if (this.socket == null || this.socket.readyState === WebSocket.CLOSED) {
      this.init();
      return;
    }

    if (this.socket.readyState === WebSocket.CLOSING) {
      this.closingCount++;

      if (this.closingCount > 50) {
        this.socket.terminate();
        this.closingCount = 0;
      }
    }
  }
}
