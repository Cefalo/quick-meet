import { Injectable } from '@nestjs/common';
@Injectable()
export class AppService {
  getHello(): string {
    return `<pre>
      Hello from the other side.
      APP_DOMAIN:  ${process.env.DOMAIN} \n
    </pre>`;
  }
}
