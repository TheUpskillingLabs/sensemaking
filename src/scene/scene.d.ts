export interface Scene {
  setReady(): void;
  showPortal(): void;
  leave(): Promise<void>;
  jolt(): void;
  relayout(): void;
  destroy(): void;
}

export function createScene(opts: {
  root: HTMLElement;
  scene: HTMLCanvasElement;
  orb?: HTMLCanvasElement | null;
  slot: HTMLElement;
  col?: HTMLElement | null;
  portal?: HTMLElement | null;
  images?: Array<HTMLImageElement | null>;
  onFormed?: () => void;
}): Scene;
