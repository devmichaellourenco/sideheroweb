import { setDefaultGameClient } from '../messaging/defaultGameClient';
import { InProcessGameClient } from '../messaging/InProcessGameClient';
import { createGameApplication } from '../di/createGameApplication';
import { SerialTaskRunner } from '../background/SerialTaskRunner';

export function bootGameRuntime(): void {
  const app = createGameApplication();
  const runner = new SerialTaskRunner();
  setDefaultGameClient(new InProcessGameClient(app, runner));
}
